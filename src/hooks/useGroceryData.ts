import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as staticProducts, stores as staticStores, type Product, type Store } from "@/data/groceryData";

export function useGroceryData() {
  const { data, isLoading } = useQuery({
    queryKey: ["grocery-products"],
    queryFn: async () => {
      // Fetch products with their prices from DB
      const { data: dbProducts, error: prodErr } = await supabase
        .from("products")
        .select("*");

      // Fetch all prices in batches to avoid the 1000-row default limit
      let allPrices: any[] = [];
      let priceErr: any = null;
      const batchSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error } = await supabase
          .from("product_prices")
          .select("*")
          .range(offset, offset + batchSize - 1);

        if (error) {
          priceErr = error;
          break;
        }
        if (batch && batch.length > 0) {
          allPrices = allPrices.concat(batch);
          offset += batchSize;
          hasMore = batch.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const dbPrices = allPrices;

      // If DB has data, use it
      if (!prodErr && !priceErr && dbProducts && dbProducts.length > 0 && dbPrices && dbPrices.length > 0) {
        const products: Product[] = dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
          name_nl: (p as any).name_nl || undefined,
          name_fr: (p as any).name_fr || undefined,
          brand: (p as any).brand || undefined,
          category: p.category,
          unit: p.unit,
          image: p.image || "🛒",
          prices: dbPrices
            .filter((pr) => pr.product_id === p.id)
            .map((pr) => ({
              storeId: pr.store_id,
              price: Number(pr.price),
              onSale: pr.on_sale || false,
            })),
        }));

        // Only return products that have at least one price
        return products.filter((p) => p.prices.length > 0);
      }

      // Fallback to static data
      return staticProducts;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  return {
    products: data || staticProducts,
    stores: staticStores,
    isLoading,
  };
}
