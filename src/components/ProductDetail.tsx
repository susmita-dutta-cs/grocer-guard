import { ArrowLeft, Heart, Tag } from "lucide-react";
import { Product, stores, getLowestPrice } from "@/data/groceryData";
import { useProductName } from "@/hooks/useProductName";
import { useI18n } from "@/hooks/useI18n";
import { useMemo } from "react";

const storeHomeBrands: Record<string, string[]> = {
  aldi: ["Aldi", "Lyttos", "Moser Roth", "Specially Selected", "Casa Morando", "Mamia", "Lacura", "Brooklea"],
  albert_heijn: ["AH", "Albert Heijn", "AH Basic", "AH Excellent", "AH Terra"],
  carrefour: ["Carrefour", "Carrefour Bio", "Carrefour Classic", "Simpl"],
  colruyt: ["Boni", "Everyday", "Spar"],
  jumbo: ["Jumbo"],
  lidl: ["Lidl", "Milbona", "Cien", "Silvercrest", "Parkside", "Perlenbacher", "Pilos"],
};

function isHomeBrandForStore(brand: string, storeId: string): boolean {
  const brands = storeHomeBrands[storeId] || [];
  return brands.some((hb) => brand.toLowerCase().includes(hb.toLowerCase()));
}

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

type BrandPrice = {
  productId: string;
  brand: string;
  price: number;
  onSale: boolean;
};

type StoreGroup = {
  storeId: string;
  storeName: string;
  brands: BrandPrice[];
  cheapest: number;
};

const ProductDetail = ({
  product,
  relatedProducts,
  onBack,
  isFavorite,
  onToggleFavorite,
}: ProductDetailProps) => {
  const { getProductName } = useProductName();
  const { t } = useI18n();

  const allVariants = useMemo(
    () => [product, ...relatedProducts.filter((p) => p.id !== product.id)],
    [product, relatedProducts]
  );

  // Group by store: for each store, collect all brand prices
  const storeGroups: StoreGroup[] = useMemo(() => {
    const map = new Map<string, BrandPrice[]>();

    for (const variant of allVariants) {
      for (const pp of variant.prices) {
        if (!map.has(pp.storeId)) map.set(pp.storeId, []);
        map.get(pp.storeId)!.push({
          productId: variant.id,
          brand: variant.brand || getProductName(variant),
          price: pp.price,
          onSale: pp.onSale || false,
        });
      }
    }

    const groups: StoreGroup[] = [];
    for (const [storeId, brands] of map) {
      const store = stores.find((s) => s.id === storeId);
      if (!store) continue;
      const sorted = brands.slice().sort((a, b) => a.price - b.price);
      groups.push({
        storeId,
        storeName: store.name,
        brands: sorted,
        cheapest: sorted[0].price,
      });
    }

    return groups.sort((a, b) => a.cheapest - b.cheapest);
  }, [allVariants, getProductName]);

  // Global max price for bar scaling
  const globalMax = useMemo(() => {
    let max = 0;
    for (const g of storeGroups) {
      for (const b of g.brands) {
        if (b.price > max) max = b.price;
      }
    }
    return max || 1;
  }, [storeGroups]);

  const globalCheapest = storeGroups.length > 0 ? storeGroups[0].cheapest : 0;

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
              {storeGroups.length} store{storeGroups.length !== 1 ? "s" : ""} · {allVariants.length} brand{allVariants.length !== 1 ? "s" : ""} · {product.unit}
            </p>
          </div>
        </div>
      </div>

      {/* Store cards */}
      <div className="space-y-3">
        {storeGroups.map((group, i) => {
          const isCheapestStore = i === 0;

          return (
            <div
              key={group.storeId}
              className={`bg-card rounded-2xl border p-4 space-y-3 animate-fade-in-up ${
                isCheapestStore ? "border-primary/30 shadow-sm" : "border-border"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Store header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`h-3 w-3 rounded-full ${storeColorMap[group.storeId]}`} />
                  <p className="font-display font-semibold text-sm text-card-foreground">
                    {group.storeName}
                  </p>
                  {isCheapestStore && (
                    <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Cheapest Store
                    </span>
                  )}
                </div>
              </div>

              {/* Brand price bars */}
              <div className="space-y-1.5">
                {group.brands.map((bp) => {
                  const barWidth = Math.max(25, (bp.price / globalMax) * 100);
                  const isLowest = bp.price === group.cheapest;

                  return (
                    <div key={bp.productId} className="flex items-center gap-2">
                      <span className="text-[10px] font-medium w-20 text-muted-foreground truncate">
                        {bp.brand}
                      </span>
                      <div className="flex-1 h-6 bg-muted/50 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full rounded-lg transition-all duration-500 ${storeColorMap[group.storeId]} ${
                            isLowest ? "opacity-90" : "opacity-30"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                        <span
                          className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold ${
                            isLowest ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          €{bp.price.toFixed(2)}
                          {bp.onSale && (
                            <span className="ml-1 text-primary font-normal text-[9px]">
                              {t("product.sale")}
                            </span>
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => onToggleFavorite(bp.productId)}
                        className="p-1 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Heart
                          className={`h-3.5 w-3.5 transition-colors ${
                            isFavorite(bp.productId) ? "fill-primary text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Store cheapest footer */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">From</span>
                <span className="text-xs font-display font-bold text-primary">
                  €{group.cheapest.toFixed(2)}
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
