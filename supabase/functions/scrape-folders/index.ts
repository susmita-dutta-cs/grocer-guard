import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StoreConfig {
  url: string;
  method: "scrape" | "search" | "screenshot" | "crawl";
  waitFor?: number;
  crawlLimit?: number;
  includePaths?: string[];
}

const STORE_PROMO_URLS: Record<string, StoreConfig> = {
  aldi: { url: "https://www.aldi.be/nl/onze-aanbiedingen.html", method: "scrape", waitFor: 3000 },
  albert_heijn: { url: "https://www.ah.be/bonus", method: "scrape", waitFor: 3000 },
  carrefour: { url: "https://www.carrefour.be/nl/promoties", method: "scrape", waitFor: 5000 },
  colruyt: {
    url: "https://www.colruyt.be/nl/acties",
    method: "crawl",
    waitFor: 8000,
    crawlLimit: 10,
    includePaths: ["/nl/acties*", "/nl/promoties*"],
  },
  jumbo: { url: "https://www.jumbo.com/aanbiedingen", method: "scrape", waitFor: 3000 },
  lidl: { url: "https://www.lidl.be/c/nl-BE/folders-magazines/s10008101", method: "screenshot", waitFor: 5000 },
};

interface ScrapeResult {
  markdown?: string;
  screenshot?: string; // base64 image or URL
}

async function scrapeStore(
  firecrawlKey: string,
  storeId: string
): Promise<ScrapeResult> {
  const config = STORE_PROMO_URLS[storeId];
  if (!config) throw new Error(`Unknown store: ${storeId}`);

  if (config.method === "search") {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: config.url,
        limit: 5,
        lang: "nl",
        country: "BE",
        scrapeOptions: { formats: ["markdown"] },
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Firecrawl search error: ${JSON.stringify(data)}`);
    const results = data.data || [];
    const markdown = results
      .map((r: any) => `${r.title || ""}\n${r.description || ""}\n${r.markdown || ""}`)
      .join("\n---\n");
    return { markdown };
  }

  if (config.method === "crawl") {
    // Step 1: Use map to quickly discover promo URLs
    console.log(`Mapping ${storeId} promo URLs...`);
    const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: config.url,
        search: "promoties acties korting aanbieding",
        limit: 20,
        includeSubdomains: false,
      }),
    });

    const mapData = await mapResponse.json();
    if (!mapResponse.ok) throw new Error(`Firecrawl map error: ${JSON.stringify(mapData)}`);

    // Filter relevant promo URLs
    const allLinks: string[] = mapData.links || [];
    const promoLinks = allLinks.filter((link: string) => {
      const lower = link.toLowerCase();
      return (config.includePaths || []).some((p: string) => {
        const pattern = p.replace("*", "");
        return lower.includes(pattern);
      }) || lower.includes("/acties") || lower.includes("/promotie");
    }).slice(0, config.crawlLimit || 5);

    console.log(`Found ${allLinks.length} URLs, ${promoLinks.length} promo URLs for ${storeId}`);

    // Step 2: Scrape the main page + top promo pages
    const urlsToScrape = [config.url, ...promoLinks.filter((l: string) => l !== config.url)].slice(0, 6);
    const allMarkdown: string[] = [];

    for (const pageUrl of urlsToScrape) {
      try {
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: config.waitFor || 3000,
          }),
        });
        const scrapeData = await scrapeRes.json();
        const md = scrapeData.data?.markdown || scrapeData.markdown || "";
        if (md.length > 50) {
          allMarkdown.push(`--- Page: ${pageUrl} ---\n${md}`);
          console.log(`Scraped ${pageUrl}: ${md.length} chars`);
        }
      } catch (e) {
        console.error(`Failed to scrape ${pageUrl}:`, e);
      }
      // Small delay between requests
      await new Promise((r) => setTimeout(r, 500));
    }

    const combinedMarkdown = allMarkdown.join("\n\n");
    console.log(`Crawl finished: ${urlsToScrape.length} pages, ${combinedMarkdown.length} total chars`);
    return { markdown: combinedMarkdown };
  }

  // For both "scrape" and "screenshot" methods, use Firecrawl scrape
  const formats = config.method === "screenshot"
    ? ["markdown", "screenshot"]
    : ["markdown"];

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.url,
      formats,
      onlyMainContent: true,
      waitFor: config.waitFor || 3000,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Firecrawl scrape error: ${JSON.stringify(data)}`);

  return {
    markdown: data.data?.markdown || data.markdown || "",
    screenshot: data.data?.screenshot || data.screenshot || undefined,
  };
}

const EXTRACTION_PROMPT = `You are a grocery promotion data extractor for Belgian supermarkets. Extract ONLY food and grocery product promotions from the provided content. Return a JSON array of objects with these fields:
- product_name: the product name (in Dutch)
- discount_type: the type of discount (e.g. "1+1 gratis", "25% korting", "2e halve prijs", "€X korting", "3+1 gratis", etc.)
- promo_price: the promotional price as a number (null if not available)
- original_price: the original price as a number (null if not available)
- category: product category in English (e.g. "dairy", "meat", "vegetables", "fruit", "beverages", "bakery", "snacks", "household", "frozen", "other")

Only include food/grocery items. Skip non-food items like clothing, furniture, electronics, tools.
Return ONLY the JSON array, no other text. If you can't find any promotions, return an empty array [].`;

function getScreenshotUrl(screenshotValue: string): string {
  // If it's a URL, use it directly
  if (screenshotValue.startsWith("http")) return screenshotValue;
  // If it's a data URL, use as-is
  if (screenshotValue.startsWith("data:")) return screenshotValue;
  // Otherwise treat as raw base64
  return `data:image/png;base64,${screenshotValue}`;
}

async function extractPromosWithVision(
  lovableApiKey: string,
  storeName: string,
  scrapeResult: ScrapeResult
): Promise<any[]> {
  const messages: any[] = [
    { role: "system", content: EXTRACTION_PROMPT },
  ];

  // Build user message with both text and image if available
  if (scrapeResult.screenshot) {
    const imageUrl = getScreenshotUrl(scrapeResult.screenshot);
    const userContent: any[] = [];

    if (scrapeResult.markdown && scrapeResult.markdown.length > 100) {
      userContent.push({
        type: "text",
        text: `Extract grocery promotions from this ${storeName} weekly folder. Here is the text content:\n\n${scrapeResult.markdown.substring(0, 10000)}`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Extract grocery promotions from this ${storeName} weekly folder image. Read all visible product names, prices, and discount labels.`,
      });
    }

    userContent.push({
      type: "image_url",
      image_url: { url: imageUrl },
    });

    messages.push({ role: "user", content: userContent });
  } else {
    // Text-only extraction
    const truncated = (scrapeResult.markdown || "").substring(0, 15000);
    messages.push({
      role: "user",
      content: `Extract grocery promotions from this ${storeName} weekly folder content:\n\n${truncated}`,
    });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add funds to your workspace.");
    }
    const err = await response.text();
    throw new Error(`AI extraction failed [${response.status}]: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";

  // Parse JSON from response (might be wrapped in ```json blocks)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.log("No JSON array found in AI response for", storeName, "- response:", content.substring(0, 200));
    return [];
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse AI response:", content.substring(0, 500));
    return [];
  }
}

async function matchProducts(
  supabase: any,
  promos: any[]
): Promise<any[]> {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, name_nl, name_fr, category");

  if (!products || products.length === 0) return promos;

  return promos.map((promo: any) => {
    const promoName = (promo.product_name || "").toLowerCase();

    // Try exact substring match first
    let match = products.find(
      (p: any) =>
        promoName.includes(p.name.toLowerCase()) ||
        (p.name_nl && promoName.includes(p.name_nl.toLowerCase())) ||
        p.name.toLowerCase().includes(promoName)
    );

    // Try word-based matching
    if (!match) {
      const promoWords = promoName.split(/\s+/).filter((w: string) => w.length > 3);
      let bestScore = 0;

      for (const p of products) {
        const pName = p.name.toLowerCase();
        const pNameNl = (p.name_nl || "").toLowerCase();
        const matchCount = promoWords.filter(
          (w: string) => pName.includes(w) || pNameNl.includes(w)
        ).length;
        const score = matchCount / Math.max(promoWords.length, 1);
        if (score > bestScore && score >= 0.5) {
          bestScore = score;
          match = p;
        }
      }
    }

    return { ...promo, matched_product_id: match?.id || null };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let storeId: string | null = null;
    try {
      const body = await req.json();
      storeId = body.store_id || null;
    } catch {
      // No body = scrape all stores
    }

    const storeIds = storeId ? [storeId] : Object.keys(STORE_PROMO_URLS);
    const results: Record<string, { promotions: number; matched: number; method: string; error?: string }> = {};

    for (const sid of storeIds) {
      try {
        const config = STORE_PROMO_URLS[sid];
        console.log(`Scraping folder for ${sid} using ${config.method}...`);

        // Step 1: Scrape the promo page (with screenshot if configured)
        const scrapeResult = await scrapeStore(firecrawlKey, sid);

        const hasContent = (scrapeResult.markdown && scrapeResult.markdown.length > 100) || scrapeResult.screenshot;
        if (!hasContent) {
          results[sid] = { promotions: 0, matched: 0, method: config.method, error: "No content found" };
          continue;
        }

        console.log(
          `${sid}: got ${scrapeResult.markdown?.length || 0} chars markdown` +
          `${scrapeResult.screenshot ? `, screenshot (${Math.round(scrapeResult.screenshot.length / 1024)}KB)` : ""}`
        );

        // Step 2: Extract promotions with AI (vision-capable for screenshots)
        const storeName = sid.replace("_", " ");
        const promos = await extractPromosWithVision(lovableApiKey, storeName, scrapeResult);
        console.log(`AI extracted ${promos.length} promos for ${sid}`);

        if (promos.length === 0) {
          results[sid] = { promotions: 0, matched: 0, method: config.method };
          continue;
        }

        // Step 3: Match to existing products
        const matchedPromos = await matchProducts(supabase, promos);

        // Step 4: Clear old promotions for this store and insert new ones
        await supabase
          .from("weekly_promotions")
          .delete()
          .eq("store_id", sid);

        const now = new Date();
        const validFrom = new Date(now);
        validFrom.setDate(validFrom.getDate() - validFrom.getDay() + 1); // Monday
        const validUntil = new Date(validFrom);
        validUntil.setDate(validUntil.getDate() + 6); // Sunday

        const inserts = matchedPromos.map((p: any) => ({
          store_id: sid,
          product_name: p.product_name || "Unknown",
          discount_type: p.discount_type || null,
          promo_price: p.promo_price || null,
          original_price: p.original_price || null,
          valid_from: validFrom.toISOString().split("T")[0],
          valid_until: validUntil.toISOString().split("T")[0],
          category: p.category || null,
          matched_product_id: p.matched_product_id || null,
          source_url: config.url,
        }));

        const { error: insertErr } = await supabase
          .from("weekly_promotions")
          .insert(inserts);

        if (insertErr) {
          console.error(`Insert error for ${sid}:`, insertErr);
          results[sid] = { promotions: promos.length, matched: 0, method: config.method, error: insertErr.message };
          continue;
        }

        // Step 5: Update on_sale flag for matched products
        const matchedIds = matchedPromos
          .filter((p: any) => p.matched_product_id)
          .map((p: any) => p.matched_product_id);

        if (matchedIds.length > 0) {
          await supabase
            .from("product_prices")
            .update({ on_sale: false })
            .eq("store_id", sid);

          for (const pid of matchedIds) {
            await supabase
              .from("product_prices")
              .update({ on_sale: true })
              .eq("store_id", sid)
              .eq("product_id", pid);
          }
        }

        const matchedCount = matchedPromos.filter((p: any) => p.matched_product_id).length;
        results[sid] = { promotions: promos.length, matched: matchedCount, method: config.method };
        console.log(`${sid}: ${promos.length} promos, ${matchedCount} matched (${config.method})`);

        // Rate limit between stores
        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Error scraping ${sid}:`, msg);
        results[sid] = { promotions: 0, matched: 0, method: STORE_PROMO_URLS[sid]?.method || "unknown", error: msg };
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Folder scrape error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
