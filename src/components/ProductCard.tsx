import { Product, stores, getLowestPrice, getHighestPrice, getSavingsPercent } from "@/data/groceryData";
import { TrendingDown } from "lucide-react";

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
  // Track view on mount
  const lowest = getLowestPrice(product);
  const highest = getHighestPrice(product);
  const savings = getSavingsPercent(product);
  const lowestStore = stores.find((s) => s.id === lowest.storeId);

  return (
    <div
      onClick={onView}
      className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{product.image}</span>
          <div>
            <h3 className="font-display font-semibold text-card-foreground leading-tight">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{product.unit}</p>
          </div>
        </div>
        {savings > 10 && (
          <span className="flex items-center gap-1 bg-savings text-savings-foreground text-xs font-bold px-2 py-1 rounded-full">
            <TrendingDown className="h-3 w-3" />
            {savings}% off
          </span>
        )}
      </div>

      {/* Price bars */}
      <div className="space-y-2">
        {product.prices
          .slice()
          .sort((a, b) => a.price - b.price)
          .map((pp) => {
            const store = stores.find((s) => s.id === pp.storeId)!;
            const isLowest = pp.storeId === lowest.storeId;
            const barWidth = Math.max(30, (pp.price / highest.price) * 100);

            return (
              <div key={pp.storeId} className="flex items-center gap-2">
                <span className="text-xs font-medium w-16 text-muted-foreground truncate">
                  {store.name}
                </span>
                <div className="flex-1 h-7 bg-muted rounded-md overflow-hidden relative">
                  <div
                    className={`h-full rounded-md transition-all duration-500 ${storeColorMap[pp.storeId]} ${
                      isLowest ? "opacity-100" : "opacity-40"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                  <span
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold ${
                      isLowest ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    €{pp.price.toFixed(2)}
                    {pp.onSale && (
                      <span className="ml-1 text-savings font-normal text-[10px]">SALE</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Best deal footer */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Best deal</span>
        <span className="text-sm font-display font-bold text-accent-foreground">
          {lowestStore?.name} — €{lowest.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
