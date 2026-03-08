import { useState } from "react";
import { Newspaper, ChevronRight, Heart } from "lucide-react";
import { usePromotions } from "@/hooks/usePromotions";
import { useFavorites } from "@/hooks/useFavorites";
import { stores } from "@/data/groceryData";

// Normalize store_id from scraped data (hyphens) to app format (underscores)
const findStore = (storeId: string) => {
  return stores.find((s) => s.id === storeId) || 
         stores.find((s) => s.id === storeId.replace(/-/g, "_")) ||
         stores.find((s) => s.name.toLowerCase() === storeId.replace(/-/g, " ").toLowerCase());
};
const getStoreName = (storeId: string) => findStore(storeId)?.name || storeId;

const categoryEmoji: Record<string, string> = {
  beverages: "🥤",
  dairy: "🥛",
  fruit: "🍎",
  vegetables: "🥦",
  meat: "🥩",
  snacks: "🍪",
  household: "🧹",
  "personal care": "🪥",
  "canned goods": "🥫",
  pantry: "🍝",
  frozen: "🧊",
  bakery: "🍞",
  vegetarian: "🌱",
  other: "🛒",
};

const PromotionsSection = () => {
  const { promotions, isLoading } = usePromotions();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (isLoading || promotions.length === 0) return null;

  const storeIds = [...new Set(promotions.map((p) => p.store_id))];

  const storeFiltered = selectedStore
    ? promotions.filter((p) => p.store_id === selectedStore)
    : promotions;

  // Get unique categories from promotions
  const categories = [...new Set(storeFiltered.map((p) => p.category || "other"))].sort();

  const filtered = selectedCategory
    ? storeFiltered.filter((p) => (p.category || "other") === selectedCategory)
    : storeFiltered;

  const displayed = expanded ? filtered : filtered.slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Newspaper className="h-5 w-5 text-secondary" />
        <h3 className="font-display font-semibold text-foreground">Weekly Deals</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {promotions.length} promotions
        </span>
      </div>

      {/* Store filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedStore(null)}
          className={`text-[11px] px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
            !selectedStore
              ? "bg-secondary text-secondary-foreground border-secondary"
              : "bg-card text-muted-foreground border-border hover:border-secondary/30"
          }`}
        >
          All stores
        </button>
        {storeIds.map((sid) => {
          const store = findStore(sid);
          return (
            <button
              key={sid}
              onClick={() => setSelectedStore(sid === selectedStore ? null : sid)}
              className={`text-[11px] px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
                selectedStore === sid
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-card text-muted-foreground border-border hover:border-secondary/30"
              }`}
            >
              {store?.name || sid}
            </button>
          );
        })}
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => { setSelectedCategory(null); setExpanded(false); }}
          className={`text-[11px] px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all flex items-center gap-1 ${
            !selectedCategory
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/30"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat === selectedCategory ? null : cat); setExpanded(false); }}
            className={`text-[11px] px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/30"
            }`}
          >
            <span>{categoryEmoji[cat.toLowerCase()] || "🛒"}</span>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {displayed.map((promo) => {
          const store = findStore(promo.store_id);
          const emoji = categoryEmoji[promo.category || "other"] || "🛒";

          return (
            <div
              key={promo.id}
              className="bg-card rounded-xl border border-border p-3 space-y-1.5 hover:border-secondary/30 transition-all"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-xl">{emoji}</span>
                {promo.discount_type && (
                  <span className="text-[9px] font-semibold bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {promo.discount_type}
                  </span>
                )}
              </div>
              <p className="font-medium text-xs text-card-foreground leading-tight line-clamp-2">
                {promo.product_name}
              </p>
              {promo.brand && (
                <p className="text-[10px] text-primary/70 font-medium">{promo.brand}</p>
              )}
              {promo.quantity && (
                <p className="text-[10px] text-muted-foreground">{promo.quantity}</p>
              )}
              <div className="flex items-baseline gap-1.5 pt-0.5">
                {promo.promo_price != null && (
                  <span className="text-sm font-display font-bold text-accent-foreground">
                    €{promo.promo_price.toFixed(2)}
                  </span>
                )}
                {promo.original_price != null && (
                  <span className={`text-[10px] ${promo.promo_price != null ? "line-through text-muted-foreground" : "font-semibold text-card-foreground"}`}>
                    €{promo.original_price.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[9px] text-muted-foreground">{store?.name}</span>
                {promo.valid_until && (
                  <span className="text-[9px] text-muted-foreground">
                    tot {new Date(promo.valid_until).toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit" })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-primary font-medium py-2 hover:bg-primary/5 rounded-lg transition-colors"
        >
          {expanded ? "Show less" : `Show all ${filtered.length} deals`}
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
      )}
    </div>
  );
};

export default PromotionsSection;
