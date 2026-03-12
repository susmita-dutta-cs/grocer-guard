import { Heart, Store, Search, X, ChevronRight, TrendingDown } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { stores, getLowestPrice, type Product } from "@/data/groceryData";
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
  const { favoriteIds, isFavorite, toggleFavorite, count: favCount } = useFavorites();
  const navigate = useNavigate();

  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStores((prev) => {
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

  // Get products available at a specific store, filtered by search
  const getStoreProducts = (storeId: string) => {
    let storeProds = products.filter((p) => p.prices.some((pr) => pr.storeId === storeId));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      storeProds = storeProds.filter(
        (p) =>
          getProductName(p).toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return storeProds;
  };

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
            <p className="text-[10px] text-muted-foreground">
              {favCount} saved · {selectedStores.size} store{selectedStores.size !== 1 ? "s" : ""} selected
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Store selection chips */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select stores to browse</p>
          <div className="flex flex-wrap gap-2">
            {stores.map((store) => {
              const isSelected = selectedStores.has(store.id);
              const productCount = products.filter((p) => p.prices.some((pr) => pr.storeId === store.id)).length;
              return (
                <button
                  key={store.id}
                  onClick={() => toggleStoreSelection(store.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <Store className="h-3.5 w-3.5" />
                  {store.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {productCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!user && (
          <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-2">
            <Heart className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Sign in to save favorites across stores.
            </p>
          </div>
        )}

        {selectedStores.size === 0 && (
          <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
            <Store className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Select one or more stores above to browse and save products.
            </p>
          </div>
        )}

        {/* Store sections */}
        {stores
          .filter((s) => selectedStores.has(s.id))
          .map((store) => {
            const storeProducts = getStoreProducts(store.id);
            const categoryGroups = groupByCategory(storeProducts);
            const favCountInStore = storeProducts.filter((p) => isFavorite(p.id)).length;

            return (
              <div key={store.id} className="rounded-2xl border border-border overflow-hidden bg-card">
                {/* Store header */}
                <div className="flex items-center gap-3 p-3.5 border-b border-border">
                  <div className={`h-9 w-9 rounded-xl ${store.colorClass} flex items-center justify-center`}>
                    <Store className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="font-display font-bold text-sm text-foreground">{store.name}</span>
                    <p className="text-[10px] text-muted-foreground">
                      {storeProducts.length} product{storeProducts.length !== 1 ? "s" : ""}
                      {favCountInStore > 0 && ` · ${favCountInStore} ♥`}
                    </p>
                  </div>
                </div>

                {/* Category subsections */}
                <div>
                  {Object.entries(categoryGroups)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([category, prods]) => {
                      const catKey = `${store.id}::${category}`;
                      const isCatExpanded = expandedCategories.has(catKey);
                      const favInCat = prods.filter((p) => isFavorite(p.id)).length;

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
                            {favInCat > 0 && (
                              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                {favInCat} ♥
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                              {prods.length}
                            </span>
                          </button>

                          {isCatExpanded && (
                            <div className="px-4 pb-2 space-y-1.5">
                              {prods.map((product, i) => (
                                <BrowseProductRow
                                  key={product.id}
                                  product={product}
                                  storeId={store.id}
                                  index={i}
                                  isFav={isFavorite(product.id)}
                                  onToggleFavorite={() => toggleFavorite(product.id)}
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
                      {searchQuery ? "No products match your search." : "No products available."}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
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

function BrowseProductRow({
  product,
  storeId,
  index,
  isFav,
  onToggleFavorite,
  getProductName,
}: {
  product: Product;
  storeId: string;
  index: number;
  isFav: boolean;
  onToggleFavorite: () => void;
  getProductName: (p: Product) => string;
}) {
  const storePrice = product.prices.find((p) => p.storeId === storeId);
  const lowest = getLowestPrice(product);
  const lowestStore = stores.find((s) => s.id === lowest.storeId);

  return (
    <div
      className={`rounded-xl p-2.5 flex items-center gap-2.5 animate-fade-in-up transition-colors ${
        isFav ? "bg-primary/5 border border-primary/20" : "bg-muted/40"
      }`}
      style={{ animationDelay: `${index * 15}ms` }}
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
        onClick={onToggleFavorite}
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
          isFav
            ? "bg-primary/15 hover:bg-primary/25"
            : "hover:bg-muted"
        }`}
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isFav ? "text-primary fill-primary" : "text-muted-foreground"
          }`}
        />
      </button>
    </div>
  );
}

export default FavoritesPage;
