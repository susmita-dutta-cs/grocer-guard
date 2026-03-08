import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORE_PROMO_URLS: Record<string, { url: string; method: "scrape" | "search" }> = {
  aldi: { url: "https://www.aldi.be/nl/onze-aanbiedingen.html", method: "scrape" },
  albert_heijn: { url: "https://www.ah.be/bonus", method: "scrape" },
  carrefour: { url: "https://www.carrefour.be/nl/promoties", method: "scrape" },
  colruyt: { url: "colruyt promoties folder deze week site:colruyt.be", method: "search" },
  jumbo: { url: "https://www.jumbo.com/aanbiedingen", method: "scrape" },
  lidl: { url: "https://www.lidl.be/c/nl-BE/folders-magazines/s10008101", method: "scrape" },
};

async function scrapeWithFirecrawl(
  firecrawlKey: string,
  storeId: string
): Promise<string> {
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
    return results.map((r: any) => `${r.title || ""}\n${r.description || ""}\n${r.markdown || ""}`).join("\n---\n");
  } else {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: config.url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Firecrawl scrape error: ${JSON.stringify(data)}`);
    return data.data?.markdown || data.markdown || "";
  }
}

async function extractPromosWithAI(
  lovableApiKey: string,
  storeName: string,
  markdown: string
): Promise<any[]> {
  // Truncate markdown to avoid token limits
  const truncated = markdown.substring(0, 15000);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a grocery promotion data extractor. Extract ONLY food and grocery product promotions from the provided content. Return a JSON array of objects with these fields:
- product_name: the product name (in Dutch)
- discount_type: the type of discount (e.g. "1+1 gratis", "25% korting", "2e halve prijs", "€X korting", etc.)
- promo_price: the promotional price as a number (null if not available)
- original_price: the original price as a number (null if not available)  
- category: product category in English (e.g. "dairy", "meat", "vegetables", "fruit", "beverages", "bakery", "snacks", "household", "frozen", "other")

Only include food/grocery items. Skip non-food items like clothing, furniture, electronics. Return ONLY the JSON array, no other text.`,
        },
        {
          role: "user",
          content: `Extract grocery promotions from this ${storeName} weekly folder content:\n\n${truncated}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI extraction failed: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";

  // Parse JSON from response (might be wrapped in ```json blocks)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse AI response:", content);
    return [];
  }
}

async function matchProducts(
  supabase: any,
  promos: any[]
): Promise<any[]> {
  // Fetch all products for matching
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
    const results: Record<string, { promotions: number; matched: number; error?: string }> = {};

    for (const sid of storeIds) {
      try {
        console.log(`Scraping folder for ${sid}...`);

        // Step 1: Scrape the promo page
        const markdown = await scrapeWithFirecrawl(firecrawlKey, sid);
        if (!markdown || markdown.length < 50) {
          results[sid] = { promotions: 0, matched: 0, error: "No content found" };
          continue;
        }

        console.log(`Got ${markdown.length} chars for ${sid}, extracting promos with AI...`);

        // Step 2: Extract promotions with AI
        const storeName = sid.replace("_", " ");
        const promos = await extractPromosWithAI(lovableApiKey, storeName, markdown);
        console.log(`AI extracted ${promos.length} promos for ${sid}`);

        if (promos.length === 0) {
          results[sid] = { promotions: 0, matched: 0 };
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
          source_url: STORE_PROMO_URLS[sid]?.url || null,
        }));

        const { error: insertErr } = await supabase
          .from("weekly_promotions")
          .insert(inserts);

        if (insertErr) {
          console.error(`Insert error for ${sid}:`, insertErr);
          results[sid] = { promotions: promos.length, matched: 0, error: insertErr.message };
          continue;
        }

        // Step 5: Update on_sale flag for matched products
        const matchedIds = matchedPromos
          .filter((p: any) => p.matched_product_id)
          .map((p: any) => p.matched_product_id);

        if (matchedIds.length > 0) {
          // Reset all on_sale for this store
          await supabase
            .from("product_prices")
            .update({ on_sale: false })
            .eq("store_id", sid);

          // Set matched products as on_sale
          for (const pid of matchedIds) {
            await supabase
              .from("product_prices")
              .update({ on_sale: true })
              .eq("store_id", sid)
              .eq("product_id", pid);
          }
        }

        const matchedCount = matchedPromos.filter((p: any) => p.matched_product_id).length;
        results[sid] = { promotions: promos.length, matched: matchedCount };
        console.log(`${sid}: ${promos.length} promos, ${matchedCount} matched`);

        // Rate limit between stores
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Error scraping ${sid}:`, msg);
        results[sid] = { promotions: 0, matched: 0, error: msg };
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
