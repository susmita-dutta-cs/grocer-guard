import type { SmartBasketResult } from "@/hooks/useRecommendations";
import { products } from "@/data/groceryData";
import { ShoppingCart, Check, Plus } from "lucide-react";

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
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-card-foreground">Smart Basket</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Add items to your basket to see which store gives you the lowest total.
      </p>

      {/* Product toggles */}
      <div className="flex flex-wrap gap-2">
        {products.map((p) => {
          const inBasket = basketIds.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                inBasket
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {inBasket ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              <span>{p.image}</span>
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground">
            Total for {results[0].itemCount} items:
          </p>
          {results.map((r, i) => {
            const isFirst = i === 0;
            return (
              <div
                key={r.storeId}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                  isFirst ? "bg-accent" : "bg-muted/50"
                }`}
              >
                <div className={`h-3 w-3 rounded-full ${storeColorMap[r.storeId]}`} />
                <span
                  className={`flex-1 text-sm font-medium ${
                    isFirst ? "text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  {r.storeName}
                </span>
                <span
                  className={`text-sm font-display font-bold ${
                    isFirst ? "text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  ${r.totalCost.toFixed(2)}
                </span>
                {isFirst && r.savings > 0 && (
                  <span className="text-[10px] font-bold bg-savings text-savings-foreground px-2 py-0.5 rounded-full">
                    Save ${r.savings.toFixed(2)}
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
