import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function usePromotionFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    supabase
      .from("user_promotion_favorites")
      .select("promotion_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setFavoriteIds(new Set(data.map((d) => d.promotion_id)));
        }
      });
  }, [user]);

  const toggleFavorite = useCallback(
    async (promotionId: string) => {
      if (!user) {
        toast.error("Sign in to save favorites");
        return;
      }

      const isFav = favoriteIds.has(promotionId);

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(promotionId);
        else next.add(promotionId);
        return next;
      });

      if (isFav) {
        const { error } = await supabase
          .from("user_promotion_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("promotion_id", promotionId);
        if (error) {
          setFavoriteIds((prev) => new Set(prev).add(promotionId));
          toast.error("Failed to remove favorite");
        }
      } else {
        const { error } = await supabase
          .from("user_promotion_favorites")
          .insert({ user_id: user.id, promotion_id: promotionId });
        if (error) {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(promotionId);
            return next;
          });
          toast.error("Failed to add favorite");
        }
      }
    },
    [user, favoriteIds]
  );

  const isFavorite = useCallback(
    (promotionId: string) => favoriteIds.has(promotionId),
    [favoriteIds]
  );

  return { isFavorite, toggleFavorite };
}
