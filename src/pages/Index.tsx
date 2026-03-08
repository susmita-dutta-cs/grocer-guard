import { useState, useMemo } from "react";
import { ShoppingBasket, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-groceries.png";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import StatsBar from "@/components/StatsBar";
import RecommendationRow from "@/components/RecommendationRow";
import SmartBasket from "@/components/SmartBasket";
import BottomNav from "@/components/BottomNav";
import SettingsPanel from "@/components/SettingsPanel";
import { useGroceryData } from "@/hooks/useGroceryData";
import { useRecommendations } from "@/hooks/useRecommendations";

const Index = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("home");
  const { products } = useGroceryData();
  const { bestValue, deals, personalized, smartBasket, basketIds, toggleBasketItem, trackView } =
    useRecommendations();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, products]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="glass border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <ShoppingBasket className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-base text-foreground">GrocerySaver</h1>
            <p className="text-[10px] text-muted-foreground">Compare • Save • Shop Smart</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {activeTab === "home" && (
          <>
            {/* Hero - compact mobile */}
            <section className="relative bg-gradient-to-br from-primary/15 via-card to-card rounded-2xl border border-border overflow-hidden p-5">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <h2 className="font-display font-extrabold text-2xl text-foreground leading-tight">
                    Compare prices.
                    <br />
                    <span className="text-primary">Save every trip.</span>
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    Aldi, Albert Heijn, Carrefour, Colruyt, Jumbo & Lidl
                  </p>
                </div>
                <img
                  src={heroImage}
                  alt="Fresh groceries"
                  className="w-24 object-contain opacity-80"
                />
              </div>
            </section>

            {/* Stats */}
            <StatsBar />

            {/* Recommendations */}
            <section className="space-y-5">
              <RecommendationRow recommendations={deals} reason="deal_trending" />
              <RecommendationRow recommendations={bestValue} reason="best_value" />
              {personalized.length > 0 && (
                <RecommendationRow recommendations={personalized} reason="personalized" />
              )}
            </section>

            {/* Category + Products */}
            <div className="space-y-4">
              <CategoryFilter selected={category} onSelect={setCategory} />

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-base text-foreground">
                    {category === "All" ? "All Products" : category}
                  </h3>
                  <span className="text-xs text-muted-foreground">{filtered.length} items</span>
                </div>

                {filtered.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg">No products found</p>
                    <p className="text-sm mt-1">Try a different search or category</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={i}
                        onView={() => trackView(product.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {activeTab === "search" && (
          <div className="space-y-4">
            <SearchBar value={search} onChange={setSearch} />
            <CategoryFilter selected={category} onSelect={setCategory} />
            <div className="space-y-3">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  onView={() => trackView(product.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "basket" && (
          <SmartBasket basketIds={basketIds} results={smartBasket} onToggle={toggleBasketItem} />
        )}

        {activeTab === "settings" && <SettingsPanel />}
      </main>

      <BottomNav
        active={activeTab}
        onNavigate={setActiveTab}
        basketCount={basketIds.length}
      />
    </div>
  );
};

export default Index;
