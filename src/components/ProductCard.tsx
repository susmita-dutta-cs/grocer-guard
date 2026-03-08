import { Product, stores, getLowestPrice, getHighestPrice, getSavingsPercent } from "@/data/groceryData";
import { TrendingDown } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useProductName } from "@/hooks/useProductName";

interface ProductCardProps {
  product: Product;
  index: number;
  onView?: () => void;
}

const storeColorMap: Record<string, string> = {
  aldi: "bg-store-1",
  albert_heijn: "bg-store-2",
  carrefour: "bg-store-3",
  colruyt: "bg-store-4",
  jumbo: "bg-store-5",
  lidl: "bg-store-6",
};

const ProductCard = ({ product, index, onView }: ProductCardProps) => {
  const { t } = useI18n();
  const { getProductName } = useProductName();
  const translatedName = getProductName(product);
  const translatedUnit = t(`unit.${product.unit}`) !== `unit.${product.unit}` ? t(`unit.${product.unit}`) : product.unit;
  const lowest = getLowestPrice(product);
  const highest = getHighestPrice(product);
  const savings = getSavingsPercent(product);
  const lowestStore = stores.find((s) => s.id === lowest.storeId);

  return (
    <div
      onClick={onView}
      className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:border-primary/30 transition-all animate-fade-in-up cursor-pointer active:scale-[0.98]"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
            {product.image}
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-card-foreground leading-tight">
              {translatedName}
            </h3>
            {product.brand && (
              <p className="text-[10px] text-primary/70 font-medium mt-0.5">{product.brand}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">{translatedUnit}</p>
          </div>
        </div>
        {savings > 10 && (
          <span className="flex items-center gap-1 bg-primary/15 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
            <TrendingDown className="h-3 w-3" />
            {savings}%
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {product.prices
          .slice()
          .sort((a, b) => a.price - b.price)
          .map((pp) => {
            const store = stores.find((s) => s.id === pp.storeId)!;
            const isLowest = pp.storeId === lowest.storeId;
            const barWidth = Math.max(25, (pp.price / highest.price) * 100);

            return (
              <div key={pp.storeId} className="flex items-center gap-2">
                <span className="text-[10px] font-medium w-14 text-muted-foreground truncate">
                  {store.name}
                </span>
                <div className="flex-1 h-6 bg-muted/50 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full rounded-lg transition-all duration-500 ${storeColorMap[pp.storeId]} ${
                      isLowest ? "opacity-90" : "opacity-25"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                  <span
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold ${
                      isLowest ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    €{pp.price.toFixed(2)}
                    {pp.onSale && (
                      <span className="ml-1 text-primary font-normal text-[9px]">{t("product.sale")}</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{t("product.bestDeal")}</span>
        <span className="text-xs font-display font-bold text-primary">
          {lowestStore?.name} — €{lowest.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
