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

      const { data: dbPrices, error: priceErr } = await supabase
        .from("product_prices")
        .select("*");

      // If DB has data, use it
      if (!prodErr && !priceErr && dbProducts && dbProducts.length > 0 && dbPrices && dbPrices.length > 0) {
        const products: Product[] = dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
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
