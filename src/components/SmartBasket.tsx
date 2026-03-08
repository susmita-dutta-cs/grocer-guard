import type { SmartBasketResult } from "@/hooks/useRecommendations";
import { useGroceryData } from "@/hooks/useGroceryData";
import { ShoppingCart, Check, Plus } from "lucide-react";
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

interface SmartBasketProps {
  basketIds: string[];
  results: SmartBasketResult[];
  onToggle: (id: string) => void;
}

const SmartBasket = ({ basketIds, results, onToggle }: SmartBasketProps) => {
  const { t } = useI18n();
  const { products } = useGroceryData();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold text-xl text-foreground">{t("basket.title")}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{t("basket.description")}</p>

      <div className="flex flex-wrap gap-2">
        {products.map((p) => {
          const inBasket = basketIds.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={`flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border transition-all active:scale-95 ${
                inBasket
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:border-primary/20"
              }`}
            >
              {inBasket ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              <span>{p.image}</span>
              {t(`product.${p.name}`) !== `product.${p.name}` ? t(`product.${p.name}`) : p.name}
            </button>
          );
        })}
      </div>

      {results.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground">
            {t("basket.totalFor")} {results[0].itemCount} {t("basket.items")}:
          </p>
          {results.map((r, i) => {
            const isFirst = i === 0;
            return (
              <div
                key={r.storeId}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isFirst ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"
                }`}
              >
                <div className={`h-3 w-3 rounded-full ${storeColorMap[r.storeId]}`} />
                <span className={`flex-1 text-sm font-medium ${isFirst ? "text-foreground" : "text-muted-foreground"}`}>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmartBasket;
