import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORES = [
  { id: "aldi", name: "Aldi", searchSuffix: "site:aldi.be OR aldi prix prijs" },
  { id: "albert_heijn", name: "Albert Heijn", searchSuffix: "site:ah.nl OR albert heijn prijs" },
  { id: "carrefour", name: "Carrefour", searchSuffix: "site:carrefour.be OR carrefour prix" },
  { id: "colruyt", name: "Colruyt", searchSuffix: "site:colruyt.be OR colruyt prix prijs" },
  { id: "jumbo", name: "Jumbo", searchSuffix: "site:jumbo.com OR jumbo prijs" },
  { id: "lidl", name: "Lidl", searchSuffix: "site:lidl.be OR lidl prix prijs" },
];

const BATCH_SIZE = 15; // Products per invocation to stay within timeout

function extractPrice(text: string): number | null {
  const priceRegex = /€\s?(\d{1,3}(?:[.,]\d{2})?)|(\d{1,3}(?:[.,]\d{2})?)\s?€/g;
  const matches = [...text.matchAll(priceRegex)];
  if (matches.length === 0) return null;

  const prices = matches
    .map((m) => {
      const val = (m[1] || m[2] || "").replace(",", ".");
      return parseFloat(val);
    })
    .filter((p) => !isNaN(p) && p >= 0.10 && p <= 100);

  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function detectSale(text: string): boolean {
  const saleKeywords = /promo|actie|aanbieding|soldes|korting|réduction|sale|discount|-\d+%/i;
  return saleKeywords.test(text);
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request params
    let storeId: string | null = null;
    let offset = 0;

    try {
      const body = await req.json();
      storeId = body.store_id || null;
      offset = body.offset || 0;
    } catch {
      // No body = scrape all stores from offset 0
    }

    const storesToScrape = storeId
      ? STORES.filter((s) => s.id === storeId)
      : STORES;

    // Fetch products from DB
    const { data: dbProducts, error: prodErr } = await supabase
      .from("products")
      .select("id, name")
      .order("name")
      .range(offset, offset + BATCH_SIZE - 1);

    if (prodErr || !dbProducts || dbProducts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          done: true,
          message: "No more products to scrape",
          offset,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create scrape log
    const { data: logEntry } = await supabase
      .from("scrape_logs")
      .insert({
        status: "running",
        store_id: storeId,
      })
      .select()
      .single();

    let totalFound = 0;
    const errors: string[] = [];

    for (const product of dbProducts) {
      for (const store of storesToScrape) {
        try {
          const query = `${product.name} ${store.searchSuffix}`;
          console.log(`Searching: ${query}`);

          const response = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              limit: 3,
              lang: "nl",
              country: "BE",
              scrapeOptions: { formats: ["markdown"] },
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 402) {
              errors.push("Firecrawl credits exhausted");
              break;
            }
            errors.push(`Search failed for ${product.name} at ${store.name}`);
            continue;
          }

          let foundPrice: number | null = null;
          let sourceUrl = "";
          let onSale = false;

          const results = data.data || [];
          for (const result of results) {
            const text = `${result.title || ""} ${result.description || ""} ${result.markdown || ""}`;
            const price = extractPrice(text);
            if (price !== null) {
              foundPrice = price;
              sourceUrl = result.url || "";
              onSale = detectSale(text);
              break;
            }
          }

          if (foundPrice !== null) {
            await supabase.from("product_prices").upsert(
              {
                product_id: product.id,
                store_id: store.id,
                price: foundPrice,
                on_sale: onSale,
                scraped_at: new Date().toISOString(),
                source_url: sourceUrl,
              },
              { onConflict: "product_id,store_id" }
            );
            totalFound++;
            console.log(`Found ${product.name} at ${store.name}: €${foundPrice}${onSale ? " (SALE)" : ""}`);
          }

          // Rate limit delay
          await new Promise((r) => setTimeout(r, 300));
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Error: ${product.name} at ${store.name}: ${msg}`);
        }
      }
    }

    // Update scrape log
    if (logEntry) {
      await supabase
        .from("scrape_logs")
        .update({
          status: errors.length > 0 ? "completed_with_errors" : "completed",
          products_found: totalFound,
          error_message: errors.length > 0 ? errors.slice(0, 10).join("; ") : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    const hasMore = dbProducts.length === BATCH_SIZE;

    return new Response(
      JSON.stringify({
        success: true,
        done: !hasMore,
        products_scraped: dbProducts.length,
        prices_found: totalFound,
        next_offset: hasMore ? offset + BATCH_SIZE : null,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
