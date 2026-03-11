import { Heart, Store, ChevronDown, ChevronRight, Trash2, TrendingDown, Search, X } from "lucide-react";
import { useState, useMemo } from "react";
import { stores, getLowestPrice, categories, type Product } from "@/data/groceryData";
import { useGroceryData } from "@/hooks/useGroceryData";
import { useAuth } from "@/hooks/useAuth";
import { useProductName } from "@/hooks/useProductName";
import { useFavorites } from "@/hooks/useFavorites";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

const FavoritesPage = () => {
  const { user } = useAuth();
  const { products } = useGroceryData();
  const { getProductName } = useProductName();
  const { favoriteIds, toggleFavorite, count: favCount } = useFavorites();
  const navigate = useNavigate();
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const favoriteProducts = useMemo(() => {
    const favs = products.filter((p) => favoriteIds.has(p.id));
    if (!searchQuery.trim()) return favs;
    const q = searchQuery.toLowerCase();
    return favs.filter(
      (p) =>
        getProductName(p).toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, favoriteIds, searchQuery, getProductName]);

  const toggleStore = (storeId: string) => {
    setExpandedStores((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // For each store, get favorites that have a price at that store
  const getStoreProducts = (storeId: string) =>
    favoriteProducts.filter((p) => p.prices.some((pr) => pr.storeId === storeId));

  // Group products by category
  const groupByCategory = (prods: Product[]) => {
    const grouped: Record<string, Product[]> = {};
    for (const p of prods) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }
    return grouped;
  };

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

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
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
          stores.map((store) => {
            const storeProducts = getStoreProducts(store.id);
            const isStoreExpanded = expandedStores.has(store.id);
            const categoryGroups = groupByCategory(storeProducts);
            const categoryCount = Object.keys(categoryGroups).length;

            return (
              <div key={store.id} className="rounded-2xl border border-border overflow-hidden bg-card">
                {/* Store header */}
                <button
                  onClick={() => toggleStore(store.id)}
                  className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className={`h-9 w-9 rounded-xl ${store.colorClass} flex items-center justify-center`}>
                    <Store className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-display font-bold text-sm text-foreground">{store.name}</span>
                    <p className="text-[10px] text-muted-foreground">
                      {storeProducts.length} favorite{storeProducts.length !== 1 ? "s" : ""}
                      {categoryCount > 0 && ` · ${categoryCount} categor${categoryCount !== 1 ? "ies" : "y"}`}
                    </p>
                  </div>
                  {storeProducts.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {storeProducts.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                      isStoreExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded: category subsections */}
                {isStoreExpanded && storeProducts.length > 0 && (
                  <div className="border-t border-border">
                    {Object.entries(categoryGroups)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([category, prods]) => {
                        const catKey = `${store.id}::${category}`;
                        const isCatExpanded = expandedCategories.has(catKey);

                        return (
                          <div key={catKey} className="border-b border-border last:border-b-0">
                            <button
                              onClick={() => toggleCategory(catKey)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                            >
                              <ChevronRight
                                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                                  isCatExpanded ? "rotate-90" : ""
                                }`}
                              />
                              <span className="text-xs font-semibold text-foreground flex-1 text-left">
                                {category}
                              </span>
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                {prods.length}
                              </span>
                            </button>

                            {isCatExpanded && (
                              <div className="px-4 pb-2 space-y-1.5">
                                {prods.map((product, i) => (
                                  <FavoriteProductRow
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

                    {storeProducts.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No favorites available at this store.
                      </p>
                    )}
                  </div>
                )}

                {isStoreExpanded && storeProducts.length === 0 && (
                  <div className="border-t border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      None of your favorites are available here.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      <BottomNav
        active="favorites"
        onNavigate={(tab) => {
          if (tab === "home") navigate("/");
          else if (tab === "basket") navigate("/?tab=basket");
          else if (tab === "settings") navigate("/?tab=settings");
        }}
        favoritesCount={favCount}
      />
    </div>
  );
};

function FavoriteProductRow({
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
      className="bg-muted/40 rounded-xl p-2.5 flex items-center gap-2.5 animate-fade-in-up"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center text-base shrink-0">
        {product.image}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-xs text-card-foreground truncate">
          {getProductName(product)}
        </p>
        {product.brand && (
          <p className="text-[9px] text-primary/70 font-medium">{product.brand}</p>
        )}
        <div className="flex items-center gap-1.5 mt-0.5">
          {storePrice && (
            <span className="text-xs font-display font-bold text-foreground">
              €{storePrice.price.toFixed(2)}
            </span>
          )}
          {storePrice && lowest.storeId !== storeId && (
            <span className="flex items-center gap-0.5 text-[9px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-full">
              <TrendingDown className="h-2.5 w-2.5" />
              €{lowest.price.toFixed(2)} at {lowestStore?.name}
            </span>
          )}
          {storePrice?.onSale && (
            <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium">
              Sale
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

export default FavoritesPage;
