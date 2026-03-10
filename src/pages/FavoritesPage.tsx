import { Heart, TrendingDown, Trash2, Store, ChevronRight } from "lucide-react";
import { useState } from "react";
import { stores, getLowestPrice, type Product } from "@/data/groceryData";
import { useGroceryData } from "@/hooks/useGroceryData";
import { useAuth } from "@/hooks/useAuth";
import { useProductName } from "@/hooks/useProductName";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n } from "@/hooks/useI18n";
import BottomNav from "@/components/BottomNav";
import { ShoppingBasket, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FavoritesPage = () => {
  const { user } = useAuth();
  const { products } = useGroceryData();
  const { getProductName } = useProductName();
  const { favoriteIds, toggleFavorite, count: favCount } = useFavorites();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  const favoriteProducts = products.filter((p) => favoriteIds.has(p.id));

  // Group favorites by cheapest store
  const groupedByStore = stores.reduce<Record<string, Product[]>>((acc, store) => {
    const storeProducts = favoriteProducts.filter((p) => {
      const lowest = getLowestPrice(p);
      return lowest.storeId === store.id;
    });
    if (storeProducts.length > 0) {
      acc[store.id] = storeProducts;
    }
    return acc;
  }, {});

  // Also group by ALL stores that carry the product
  const groupedByAllStores = stores.reduce<Record<string, Product[]>>((acc, store) => {
    const storeProducts = favoriteProducts.filter((p) =>
      p.prices.some((pr) => pr.storeId === store.id)
    );
    if (storeProducts.length > 0) {
      acc[store.id] = storeProducts;
    }
    return acc;
  }, {});

  const [groupMode, setGroupMode] = useState<"cheapest" | "available">("cheapest");
  const grouped = groupMode === "cheapest" ? groupedByStore : groupedByAllStores;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="glass border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-base text-foreground">My Favorites</h1>
            <p className="text-[10px] text-muted-foreground">{favCount} products saved</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {!user ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Sign in to save your favorite products and track prices by store.
            </p>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Tap the ♥ on any product to add it here.
            </p>
          </div>
        ) : (
          <>
            {/* Group mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setGroupMode("cheapest")}
                className={`flex-1 text-xs font-medium py-2 px-3 rounded-xl border transition-colors ${
                  groupMode === "cheapest"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                By cheapest store
              </button>
              <button
                onClick={() => setGroupMode("available")}
                className={`flex-1 text-xs font-medium py-2 px-3 rounded-xl border transition-colors ${
                  groupMode === "available"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                By availability
              </button>
            </div>

            {/* Store groups */}
            {stores.map((store) => {
              const storeProducts = grouped[store.id];
              if (!storeProducts || storeProducts.length === 0) return null;
              const isExpanded = expandedStore === store.id || expandedStore === null;

              return (
                <div key={store.id} className="space-y-2">
                  <button
                    onClick={() =>
                      setExpandedStore(expandedStore === store.id ? null : store.id)
                    }
                    className="w-full flex items-center gap-2.5 py-2"
                  >
                    <div className={`h-8 w-8 rounded-lg ${store.colorClass} flex items-center justify-center`}>
                      <Store className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-display font-bold text-sm text-foreground flex-1 text-left">
                      {store.name}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {storeProducts.length}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="space-y-1.5 pl-2">
                      {storeProducts.map((product, i) => (
                        <FavoriteStoreCard
                          key={product.id}
                          product={product}
                          storeId={store.id}
                          index={i}
                          onRemove={() => toggleFavorite(product.id)}
                          getProductName={getProductName}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </main>

      <BottomNav active="favorites" onNavigate={(tab) => {
        if (tab === "home") navigate("/");
        else if (tab === "favorites") { /* already here */ }
        else if (tab === "basket") navigate("/?tab=basket");
        else if (tab === "settings") navigate("/?tab=settings");
      }} favoritesCount={favCount} />
    </div>
  );
};

function FavoriteStoreCard({
  product,
  storeId,
  index,
  onRemove,
  getProductName,
}: {
  product: Product;
  storeId: string;
  index: number;
  onRemove: () => void;
  getProductName: (p: Product) => string;
}) {
  const storePrice = product.prices.find((p) => p.storeId === storeId);
  const lowest = getLowestPrice(product);
  const lowestStore = stores.find((s) => s.id === lowest.storeId);

  return (
    <div
      className="bg-card rounded-xl border border-border p-3 flex items-center gap-3 animate-fade-in-up"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
        {product.image}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm text-card-foreground truncate">
          {getProductName(product)}
        </p>
        {product.brand && (
          <p className="text-[10px] text-primary/70 font-medium">{product.brand}</p>
        )}
        <div className="flex items-center gap-1.5 mt-0.5">
          {storePrice && (
            <span className="text-xs font-display font-bold text-foreground">
              €{storePrice.price.toFixed(2)}
            </span>
          )}
          {storePrice && lowest.storeId !== storeId && (
            <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-full">
              <TrendingDown className="h-2.5 w-2.5" />
              €{lowest.price.toFixed(2)} at {lowestStore?.name}
            </span>
          )}
          {storePrice?.onSale && (
            <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium">
              Sale
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

export default FavoritesPage;
