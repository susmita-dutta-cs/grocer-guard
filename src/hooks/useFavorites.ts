import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    setLoading(true);
    supabase
      .from("user_favorites")
      .select("product_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (data) {
          setFavoriteIds(new Set(data.map((d) => d.product_id)));
        }
        setLoading(false);
      });
  }, [user]);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        toast.error("Sign in to save favorites");
        return;
      }

      const isFav = favoriteIds.has(productId);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(productId);
        else next.add(productId);
        return next;
      });

      if (isFav) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) {
          // Revert
          setFavoriteIds((prev) => new Set(prev).add(productId));
          toast.error("Failed to remove favorite");
        }
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, product_id: productId });
        if (error) {
          // Revert
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
          toast.error("Failed to add favorite");
        }
      }
    },
    [user, favoriteIds]
  );

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  );

  return { favoriteIds, isFavorite, toggleFavorite, loading, count: favoriteIds.size };
}
