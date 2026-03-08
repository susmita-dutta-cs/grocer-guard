import { Heart, TrendingDown, Trash2 } from "lucide-react";
import { Product, getLowestPrice, stores } from "@/data/groceryData";
import { useGroceryData } from "@/hooks/useGroceryData";
import { useAuth } from "@/hooks/useAuth";
import { useProductName } from "@/hooks/useProductName";
import { useI18n } from "@/hooks/useI18n";

interface FavoritesSectionProps {
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const FavoritesSection = ({ favoriteIds, onToggleFavorite }: FavoritesSectionProps) => {
  const { products } = useGroceryData();
  const { user } = useAuth();
  const { getProductName } = useProductName();
  const { t } = useI18n();

  const favoriteProducts = products.filter((p) => favoriteIds.has(p.id));

  if (!user) {
    return (
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-foreground">My Favorites</h2>
        <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
          <Heart className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Sign in to save your favorite products and track prices weekly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-foreground">My Favorites</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {favoriteIds.size} saved
        </span>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
          <Heart className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Tap the ♥ on any product in Search to add it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {favoriteProducts.map((product, i) => (
            <FavoriteCard
              key={product.id}
              product={product}
              index={i}
              onRemove={() => onToggleFavorite(product.id)}
              getProductName={getProductName}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function FavoriteCard({
  product,
  index,
  onRemove,
  getProductName,
}: {
  product: Product;
  index: number;
  onRemove: () => void;
  getProductName: (p: Product) => string;
}) {
  const lowest = getLowestPrice(product);
  const lowestStore = stores.find((s) => s.id === lowest.storeId);
  const prices = product.prices.slice().sort((a, b) => a.price - b.price);
  const highest = prices[prices.length - 1];

  return (
    <div
      className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3 animate-fade-in-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
        {product.image}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm text-card-foreground truncate">
          {getProductName(product)}
        </p>
        {product.brand && (
          <p className="text-[10px] text-primary/70 font-medium">{product.brand}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs font-display font-bold text-primary">
            €{lowest.price.toFixed(2)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            at {lowestStore?.name}
          </span>
          {highest && highest.price > lowest.price && (
            <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-full ml-auto">
              <TrendingDown className="h-2.5 w-2.5" />
              save €{(highest.price - lowest.price).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onRemove}
        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

export default FavoritesSection;
