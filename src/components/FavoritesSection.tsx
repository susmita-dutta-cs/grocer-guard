import { Heart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useGroceryData } from "@/hooks/useGroceryData";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";

interface FavoritesSectionProps {
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const FavoritesSection = ({ favoriteIds, onToggleFavorite }: FavoritesSectionProps) => {
  const { products } = useGroceryData();
  const { t } = useI18n();
  const { user } = useAuth();

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
            Tap the ♥ on any product to add it here and track its price weekly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {favoriteProducts.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              isFavorite={true}
              onToggleFavorite={() => onToggleFavorite(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesSection;
