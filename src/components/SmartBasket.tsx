import { useState, useMemo } from "react";
import type { SmartBasketResult } from "@/hooks/useRecommendations";
import { useGroceryData } from "@/hooks/useGroceryData";
import { ShoppingCart, Check, Plus, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useProductName } from "@/hooks/useProductName";

const storeColorMap: Record<string, string> = {
  aldi: "bg-store-1",
  albert_heijn: "bg-store-2",
  carrefour: "bg-store-3",
  colruyt: "bg-store-4",
  jumbo: "bg-store-5",
  lidl: "bg-store-6",
};

const storeHomeBrands: Record<string, string[]> = {
  aldi: ["Aldi", "Lyttos", "Moser Roth", "Specially Selected", "Casa Morando", "Mamia", "Lacura", "Brooklea"],
  albert_heijn: ["AH", "Albert Heijn", "AH Basic", "AH Excellent", "AH Terra"],
  carrefour: ["Carrefour", "Carrefour Bio", "Carrefour Classic", "Carrefour Extra", "Carrefour Original", "Simpl", "Carrefour Discount"],
  colruyt: ["Boni", "Boni Selection", "Everyday", "Spar"],
  jumbo: ["Jumbo", "Jumbo Biologisch"],
  lidl: ["Lidl", "Milbona", "Cien", "Deluxe", "Silvercrest", "Perlenbacher", "Freeway", "Solevita"],
};

interface SmartBasketProps {
  basketIds: string[];
  results: SmartBasketResult[];
  onToggle: (id: string) => void;
}

const SmartBasket = ({ basketIds, results, onToggle }: SmartBasketProps) => {
  const { t } = useI18n();
  const { products } = useGroceryData();
  const { getProductName } = useProductName();
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const toggleExpand = (storeId: string) => {
    setExpandedStore((prev) => (prev === storeId ? null : storeId));
  };

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return products
      .filter((p) => {
        const name = getProductName(p).toLowerCase();
        return name.includes(q) || p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q));
      })
      .slice(0, 8);
  }, [search, products, getProductName]);

  const basketProducts = products.filter((p) => basketIds.includes(p.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold text-xl text-foreground">{t("basket.title")}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{t("basket.description")}</p>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add..."
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {search.trim() && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">No products found</p>
          ) : (
            searchResults.map((p) => {
              const inBasket = basketIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => { onToggle(p.id); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-lg">{p.image}</span>
                  <span className="flex-1 text-xs font-medium text-foreground truncate">{getProductName(p)}</span>
                  {inBasket ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Selected items */}
      {basketProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {basketProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 transition-all active:scale-95"
            >
              <span>{p.image}</span>
              {getProductName(p)}
              <X className="h-3 w-3 ml-0.5" />
            </button>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground">
            {t("basket.totalFor")} {results[0].itemCount} {t("basket.items")}:
          </p>
          {results.map((r, i) => {
            const isFirst = i === 0;
            const isExpanded = expandedStore === r.storeId;
            return (
              <div key={r.storeId} className="space-y-0">
                <button
                  onClick={() => toggleExpand(r.storeId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isFirst ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"
                  } ${isExpanded ? "rounded-b-none" : ""}`}
                >
                  <div className={`h-3 w-3 rounded-full ${storeColorMap[r.storeId]}`} />
                  <span className={`flex-1 text-left text-sm font-medium ${isFirst ? "text-foreground" : "text-muted-foreground"}`}>
                    {r.storeName}
                  </span>
                  <span className={`text-sm font-display font-bold ${isFirst ? "text-primary" : "text-muted-foreground"}`}>
                    €{r.totalCost.toFixed(2)}
                  </span>
                  {isFirst && r.savings > 0 && (
                    <span className="text-[9px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                      {t("basket.save")} €{r.savings.toFixed(2)}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className={`border border-t-0 rounded-b-xl overflow-hidden ${
                    isFirst ? "border-primary/20" : "border-border"
                  }`}>
                    {r.items.map((item) => {
                      const homeBrands = storeHomeBrands[r.storeId] || [];
                      const isHomeBrand = item.brand && homeBrands.some(
                        (hb) => item.brand!.toLowerCase().includes(hb.toLowerCase())
                      );
                      return (
                        <div
                          key={item.productId}
                          className="flex items-center gap-3 px-4 py-2.5 border-t border-border/50 bg-card/50"
                        >
                          <span className="text-lg">{item.image}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {item.productName}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {item.brand && (
                                <p className="text-[10px] text-primary/70 font-medium">{item.brand}</p>
                              )}
                              {isHomeBrand && (
                                <span className="text-[8px] font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">
                                  Home Brand
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs font-display font-bold ${
                            item.available ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {item.available ? `€${item.price.toFixed(2)}` : "N/A"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmartBasket;