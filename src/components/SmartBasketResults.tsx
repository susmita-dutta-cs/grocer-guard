import { useState } from "react";
import type { SmartBasketResult } from "@/hooks/useRecommendations";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

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

interface SmartBasketResultsProps {
  results: SmartBasketResult[];
}

const SmartBasketResults = ({ results }: SmartBasketResultsProps) => {
  const { t } = useI18n();
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  if (results.length === 0) return null;

  return (
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
              onClick={() => setExpandedStore((prev) => (prev === r.storeId ? null : r.storeId))}
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
              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {isExpanded && (
              <div className={`border border-t-0 rounded-b-xl overflow-hidden ${isFirst ? "border-primary/20" : "border-border"}`}>
                {r.items.map((item) => {
                  const homeBrands = storeHomeBrands[r.storeId] || [];
                  const isHomeBrand = item.brand && homeBrands.some((hb) => item.brand!.toLowerCase().includes(hb.toLowerCase()));
                  return (
                    <div key={item.productId} className="flex items-center gap-3 px-4 py-2.5 border-t border-border/50 bg-card/50">
                      <span className="text-lg">{item.image}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{item.productName}</p>
                        <div className="flex items-center gap-1.5">
                          {item.brand && <p className="text-[10px] text-primary/70 font-medium">{item.brand}</p>}
                          {isHomeBrand && (
                            <span className="text-[8px] font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">Home Brand</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-display font-bold ${item.available ? "text-foreground" : "text-muted-foreground"}`}>
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
  );
};

export default SmartBasketResults;
