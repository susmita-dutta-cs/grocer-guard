import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Products to search for at each store
const PRODUCT_SEARCHES = [
  { name: "Organic Bananas", category: "Fruits & Vegetables", unit: "per lb", image: "🍌" },
  { name: "Whole Milk 1 gallon", category: "Dairy & Eggs", unit: "per gallon", image: "🥛" },
  { name: "Large Eggs dozen", category: "Dairy & Eggs", unit: "per dozen", image: "🥚" },
  { name: "Chicken Breast", category: "Meat & Seafood", unit: "per lb", image: "🍗" },
  { name: "White Bread loaf", category: "Bakery", unit: "per loaf", image: "🍞" },
  { name: "Fresh Strawberries", category: "Fruits & Vegetables", unit: "per 16 oz", image: "🍓" },
  { name: "Cheddar Cheese block", category: "Dairy & Eggs", unit: "per 8 oz", image: "🧀" },
  { name: "Ground Beef 80/20", category: "Meat & Seafood", unit: "per lb", image: "🥩" },
  { name: "Coca-Cola 12 pack cans", category: "Beverages", unit: "12 cans", image: "🥤" },
  { name: "Potato Chips bag", category: "Snacks", unit: "per 8 oz", image: "🥔" },
  { name: "Spaghetti Pasta", category: "Pantry", unit: "per 16 oz", image: "🍝" },
  { name: "Avocados", category: "Fruits & Vegetables", unit: "each", image: "🥑" },
];

const STORES = [
  { id: "aldi", name: "Aldi", searchSuffix: "aldi.be prix price" },
  { id: "albert_heijn", name: "Albert Heijn", searchSuffix: "ah.nl prijs price" },
  { id: "carrefour", name: "Carrefour", searchSuffix: "carrefour.be prix price" },
  { id: "colruyt", name: "Colruyt", searchSuffix: "colruyt.be prix price" },
  { id: "jumbo", name: "Jumbo", searchSuffix: "jumbo.com prijs price" },
  { id: "lidl", name: "Lidl", searchSuffix: "lidl.be prix price" },
];

function extractPrice(text: string): number | null {
  // Match price patterns like $3.49, $0.99, etc.
  const priceRegex = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  const matches = [...text.matchAll(priceRegex)];

  if (matches.length === 0) return null;

  // Filter reasonable grocery prices ($0.25 - $50)
  const prices = matches
    .map((m) => parseFloat(m[1].replace(",", "")))
    .filter((p) => p >= 0.25 && p <= 50);

  if (prices.length === 0) return null;

  // Return the lowest reasonable price (most likely the actual product price)
  return Math.min(...prices);
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

    // Create scrape log
    const { data: logEntry } = await supabase
      .from("scrape_logs")
      .insert({ status: "running" })
      .select()
      .single();

    let totalFound = 0;
    const errors: string[] = [];

    for (const product of PRODUCT_SEARCHES) {
      // Upsert product
      const { data: dbProduct } = await supabase
        .from("products")
        .upsert(
          { name: product.name, category: product.category, unit: product.unit, image: product.image },
          { onConflict: "name", ignoreDuplicates: false }
        )
        .select()
        .single();

      // If upsert didn't return (name not unique constraint), try to find it
      let productId = dbProduct?.id;
      if (!productId) {
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("name", product.name)
          .single();
        productId = existing?.id;
      }

      if (!productId) {
        errors.push(`Could not find/create product: ${product.name}`);
        continue;
      }

      // Search for prices at each store
      for (const store of STORES) {
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
              scrapeOptions: { formats: ["markdown"] },
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            errors.push(`Firecrawl search failed for ${product.name} at ${store.name}: ${JSON.stringify(data)}`);
            continue;
          }

          // Extract price from search results
          let foundPrice: number | null = null;
          let sourceUrl = "";

          const results = data.data || [];
          for (const result of results) {
            const text = `${result.title || ""} ${result.description || ""} ${result.markdown || ""}`;
            const price = extractPrice(text);
            if (price !== null) {
              foundPrice = price;
              sourceUrl = result.url || "";
              break;
            }
          }

          if (foundPrice !== null) {
            // Upsert price
            await supabase.from("product_prices").upsert(
              {
                product_id: productId,
                store_id: store.id,
                price: foundPrice,
                on_sale: false,
                scraped_at: new Date().toISOString(),
                source_url: sourceUrl,
              },
              { onConflict: "product_id,store_id" }
            );
            totalFound++;
            console.log(`Found ${product.name} at ${store.name}: $${foundPrice}`);
          } else {
            console.log(`No price found for ${product.name} at ${store.name}`);
          }

          // Small delay to avoid rate limiting
          await new Promise((r) => setTimeout(r, 500));
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Error scraping ${product.name} at ${store.name}: ${msg}`);
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
          error_message: errors.length > 0 ? errors.join("; ") : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        products_found: totalFound,
        errors: errors.length > 0 ? errors : undefined,
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
