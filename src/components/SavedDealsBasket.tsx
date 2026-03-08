import { Newspaper, Trash2, ExternalLink } from "lucide-react";
import { usePromotionFavorites } from "@/hooks/usePromotionFavorites";
import { usePromotions } from "@/hooks/usePromotions";
import { stores } from "@/data/groceryData";

const findStore = (storeId: string) => {
  return stores.find((s) => s.id === storeId) ||
    stores.find((s) => s.id === storeId.replace(/-/g, "_")) ||
    stores.find((s) => s.name.toLowerCase() === storeId.replace(/-/g, " ").toLowerCase());
};

const categoryEmoji: Record<string, string> = {
  beverages: "🥤", dairy: "🥛", fruit: "🍎", vegetables: "🥦", meat: "🥩",
  snacks: "🍪", household: "🧹", "personal care": "🪥", "canned goods": "🥫",
  pantry: "🍝", frozen: "🧊", bakery: "🍞", vegetarian: "🌱", other: "🛒",
};

const SavedDealsBasket = () => {
  const { favoriteIds, toggleFavorite } = usePromotionFavorites();
  const { promotions } = usePromotions();

  const savedDeals = promotions.filter((p) => favoriteIds.has(p.id));

  if (savedDeals.length === 0) return null;

  // Group by store
  const byStore = savedDeals.reduce<Record<string, typeof savedDeals>>((acc, deal) => {
    const key = deal.store_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(deal);
    return acc;
  }, {});

  const totalSavings = savedDeals.reduce((sum, d) => {
    if (d.original_price != null && d.promo_price != null) {
      return sum + (d.original_price - d.promo_price);
    }
    return sum;
  }, 0);

  const totalCost = savedDeals.reduce((sum, d) => {
    return sum + (d.promo_price ?? d.original_price ?? 0);
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Newspaper className="h-5 w-5 text-secondary" />
        <h3 className="font-display font-semibold text-foreground">Saved Deals</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {savedDeals.length} items
        </span>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Estimated total</p>
          <p className="text-lg font-display font-bold text-foreground">€{totalCost.toFixed(2)}</p>
        </div>
        {totalSavings > 0 && (
          <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2 py-1 rounded-full">
            Save €{totalSavings.toFixed(2)}
          </span>
        )}
      </div>

      {/* Grouped by store */}
      {Object.entries(byStore).map(([storeId, deals]) => {
        const store = findStore(storeId);
        const storeTotal = deals.reduce((s, d) => s + (d.promo_price ?? d.original_price ?? 0), 0);

        return (
          <div key={storeId} className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50">
              <span className="text-xs font-medium text-foreground">{store?.name || storeId}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                €{storeTotal.toFixed(2)}
              </span>
            </div>
            {deals.map((deal) => {
              const emoji = categoryEmoji[(deal.category || "other").toLowerCase()] || "🛒";
              return (
                <div
                  key={deal.id}
                  className="flex items-center gap-3 px-3 py-2.5 border-t border-border/50 bg-card"
                >
                  <span className="text-lg">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{deal.product_name}</p>
                    <div className="flex items-center gap-1.5">
                      {deal.brand && <span className="text-[10px] text-primary/70">{deal.brand}</span>}
                      {deal.quantity && <span className="text-[10px] text-muted-foreground">{deal.quantity}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deal.promo_price != null && (
                      <span className="text-xs font-display font-bold text-foreground">
                        €{deal.promo_price.toFixed(2)}
                      </span>
                    )}
                    {deal.original_price != null && deal.promo_price != null && (
                      <span className="text-[10px] line-through text-muted-foreground">
                        €{deal.original_price.toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => toggleFavorite(deal.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default SavedDealsBasket;
