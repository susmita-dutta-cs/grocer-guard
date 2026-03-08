import { ArrowLeft, Heart, TrendingDown, Tag } from "lucide-react";
import { Product, stores, getLowestPrice, getHighestPrice } from "@/data/groceryData";
import { useProductName } from "@/hooks/useProductName";
import { useI18n } from "@/hooks/useI18n";

const storeColorMap: Record<string, string> = {
  aldi: "bg-store-1",
  albert_heijn: "bg-store-2",
  carrefour: "bg-store-3",
  colruyt: "bg-store-4",
  jumbo: "bg-store-5",
  lidl: "bg-store-6",
};

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
  onBack: () => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}

const ProductDetail = ({
  product,
  relatedProducts,
  onBack,
  isFavorite,
  onToggleFavorite,
}: ProductDetailProps) => {
  const { getProductName } = useProductName();
  const { t } = useI18n();

  // All brands for this product type (including the selected one)
  const allBrands = [product, ...relatedProducts.filter((p) => p.id !== product.id)];

  // Sort by lowest price
  const sorted = allBrands.slice().sort((a, b) => getLowestPrice(a).price - getLowestPrice(b).price);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-2xl">{product.image}</span>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-foreground truncate">
              {getProductName(product)}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {sorted.length} brand{sorted.length !== 1 ? "s" : ""} available · {product.unit}
            </p>
          </div>
        </div>
      </div>

      {/* Brand cards */}
      <div className="space-y-3">
        {sorted.map((p, i) => {
          const lowest = getLowestPrice(p);
          const highest = getHighestPrice(p);
          const lowestStore = stores.find((s) => s.id === lowest.storeId);
          const isCheapest = i === 0;

          return (
            <div
              key={p.id}
              className={`bg-card rounded-2xl border p-4 space-y-3 animate-fade-in-up ${
                isCheapest ? "border-primary/30 shadow-sm" : "border-border"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Brand header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {isCheapest && (
                    <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Best Price
                    </span>
                  )}
                  <div>
                    <p className="font-display font-semibold text-sm text-card-foreground">
                      {p.brand || getProductName(p)}
                    </p>
                    {p.brand && (
                      <p className="text-[10px] text-muted-foreground">{getProductName(p)}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onToggleFavorite(p.id)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      isFavorite(p.id) ? "fill-primary text-primary" : "text-muted-foreground"
                    }`}
                  />
                </button>
              </div>

              {/* Price bars */}
              <div className="space-y-1.5">
                {p.prices
                  .slice()
                  .sort((a, b) => a.price - b.price)
                  .map((pp) => {
                    const store = stores.find((s) => s.id === pp.storeId);
                    const isLowest = pp.storeId === lowest.storeId;
                    const barWidth = Math.max(25, (pp.price / highest.price) * 100);

                    return (
                      <div key={pp.storeId} className="flex items-center gap-2">
                        <span className="text-[10px] font-medium w-14 text-muted-foreground truncate">
                          {store?.name}
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
                              <span className="ml-1 text-primary font-normal text-[9px]">
                                {t("product.sale")}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Best deal footer */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Cheapest</span>
                <span className="text-xs font-display font-bold text-primary">
                  {lowestStore?.name} — €{lowest.price.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductDetail;
