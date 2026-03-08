import { useState, useMemo } from "react";
import { ShoppingBasket, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-groceries.png";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import StatsBar from "@/components/StatsBar";
import RecommendationRow from "@/components/RecommendationRow";
import SmartBasket from "@/components/SmartBasket";
import SavedDealsBasket from "@/components/SavedDealsBasket";
import PromotionsSection from "@/components/PromotionsSection";
import BottomNav from "@/components/BottomNav";
import SettingsPanel from "@/components/SettingsPanel";
import FavoritesSection from "@/components/FavoritesSection";
import { useGroceryData } from "@/hooks/useGroceryData";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useI18n, categoryKeyMap } from "@/hooks/useI18n";
import { useProductName } from "@/hooks/useProductName";
import { useFavorites } from "@/hooks/useFavorites";
import type { Product } from "@/data/groceryData";

const Index = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products } = useGroceryData();
  const { t, language } = useI18n();
  const { getProductName } = useProductName();
  const { bestValue, deals, personalized, smartBasket, basketIds, toggleBasketItem, trackView } =
    useRecommendations();
  const { favoriteIds, isFavorite, toggleFavorite, count: favCount } = useFavorites();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const localName = getProductName(p);
      const matchesSearch = localName.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = category === "All" || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, products, language, getProductName]);

  // Find related products by matching the primary keyword in the product name
  // Home brand lists for matching
  const storeHomeBrands: Record<string, string[]> = {
    aldi: ["Aldi", "Lyttos", "Moser Roth", "Specially Selected", "Casa Morando", "Mamia", "Lacura", "Brooklea"],
    albert_heijn: ["AH", "Albert Heijn", "AH Basic", "AH Excellent", "AH Terra"],
    carrefour: ["Carrefour", "Carrefour Bio", "Carrefour Classic", "Carrefour Extra", "Carrefour Original", "Simpl", "Carrefour Discount"],
    colruyt: ["Boni", "Everyday", "Spar"],
    jumbo: ["Jumbo"],
    lidl: ["Lidl", "Milbona", "Cien", "Silvercrest", "Parkside", "Perlenbacher", "Pilos"],
  };

  const isHomeBrand = (brand: string | undefined) => {
    if (!brand) return false;
    return Object.values(storeHomeBrands).some((brands) =>
      brands.some((hb) => brand.toLowerCase().includes(hb.toLowerCase()))
    );
  };

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];

    const stopWords = new Set(["the", "and", "per", "with", "for", "from", "pack", "each", "fresh", "organic", "free", "range"]);
    const keywords = selectedProduct.name
      .toLowerCase()
      .split(/[\s\-\/\(\),]+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));

    const matchedIds = new Set<string>();

    // 1. Match by ALL keywords in name (non-home-brand products) — ensures "lentils red" doesn't match "lentils green"
    if (keywords.length > 0) {
      products.forEach((p) => {
        if (p.id !== selectedProduct.id) {
          const pName = p.name.toLowerCase();
          if (keywords.every((kw) => pName.includes(kw))) {
            matchedIds.add(p.id);
          }
        }
      });
    }

    // 2. Include home brand products from same category that match ANY keyword
    if (keywords.length > 0) {
      products.forEach((p) => {
        if (p.id !== selectedProduct.id && p.category === selectedProduct.category && isHomeBrand(p.brand)) {
          const pName = p.name.toLowerCase();
          if (keywords.some((kw) => pName.includes(kw))) {
            matchedIds.add(p.id);
          }
        }
      });
    }

    return products.filter((p) => matchedIds.has(p.id));
  }, [selectedProduct, products]);

  // Group filtered products by base name (strip brand) for the search list
  // Show a simplified card that invites drill-down
  const handleProductSelect = (product: Product) => {
    trackView(product.id);
    setSelectedProduct(product);
  };

  // Reset selection when switching tabs
  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="glass border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <ShoppingBasket className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-base text-foreground">GrocerySaver</h1>
            <p className="text-[10px] text-muted-foreground">{t("app.tagline")}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {activeTab === "home" && (
          selectedProduct ? (
            <ProductDetail
              product={selectedProduct}
              relatedProducts={relatedProducts}
              onBack={() => setSelectedProduct(null)}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
          <>
            <section className="relative bg-gradient-to-br from-primary/15 via-card to-card rounded-2xl border border-border overflow-hidden p-5">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <h2 className="font-display font-extrabold text-2xl text-foreground leading-tight">
                    {t("hero.title1")}
                    <br />
                    <span className="text-primary">{t("hero.title2")}</span>
                  </h2>
                  <p className="text-muted-foreground text-xs">{t("hero.subtitle")}</p>
                </div>
                <img src={heroImage} alt="Fresh groceries" className="w-24 object-contain opacity-80" />
              </div>
            </section>

            <SearchBar value={search} onChange={setSearch} />

            {search.trim() ? (
              <div className="space-y-3">
                {filtered.slice(0, 20).map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    onView={() => handleProductSelect(product)}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                  />
                ))}
                {filtered.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-8">No products found</p>
                )}
              </div>
            ) : (
              <>
                <StatsBar />
                <section className="space-y-5">
                  <RecommendationRow recommendations={deals} reason="deal_trending" />
                  <RecommendationRow recommendations={bestValue} reason="best_value" />
                  {personalized.length > 0 && (
                    <RecommendationRow recommendations={personalized} reason="personalized" />
                  )}
                  <PromotionsSection />
                </section>
              </>
            )}
          </>
          )
        )}


        {activeTab === "basket" && (
          <div className="space-y-6">
            <SavedDealsBasket />
            <FavoritesSection favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
            <SmartBasket basketIds={basketIds} results={smartBasket} onToggle={toggleBasketItem} />
          </div>
        )}

        {activeTab === "settings" && <SettingsPanel />}
      </main>

      <BottomNav active={activeTab} onNavigate={handleNavigate} basketCount={basketIds.length} favoritesCount={favCount} />
    </div>
  );
};

export default Index;
