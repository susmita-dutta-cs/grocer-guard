import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Promotion {
  id: string;
  product_name: string;
  brand: string | null;
  store_id: string;
  original_price: number | null;
  promo_price: number | null;
  quantity: string | null;
  discount_type: string | null;
  category: string | null;
  valid_from: string | null;
  valid_until: string | null;
}

export function usePromotions() {
  const { data, isLoading } = useQuery({
    queryKey: ["weekly-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_promotions")
        .select("id, product_name, brand, store_id, original_price, promo_price, quantity, discount_type, category, valid_from, valid_until")
        .order("store_id")
        .order("category");

      if (error) throw error;
      return (data || []) as Promotion[];
    },
    staleTime: 1000 * 60 * 10,
  });

  return { promotions: data || [], isLoading };
}
