import { useState, useMemo } from "react";
import type { SmartBasketResult } from "@/hooks/useRecommendations";
import { useGroceryData } from "@/hooks/useGroceryData";
import { categories } from "@/data/groceryData";
import { ShoppingCart, Check, Plus, ChevronDown, ChevronUp, Search, X, Filter } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useProductName } from "@/hooks/useProductName";
import SmartBasketResults from "@/components/SmartBasketResults";

interface SmartBasketProps {
  basketIds: string[];
  results: SmartBasketResult[];
  onToggle: (id: string) => void;
}

const SmartBasket = ({ basketIds, results, onToggle }: SmartBasketProps) => {
  const { t } = useI18n();
  const { products } = useGroceryData();
  const { getProductName } = useProductName();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [showBrandFilter, setShowBrandFilter] = useState(false);
  const [search, setSearch] = useState("");

  // Get unique brands for the selected category
  const availableBrands = useMemo(() => {
    const catProducts = selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);
    const brands = new Set<string>();
    catProducts.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [products, selectedCategory]);

  // Filtered products by category + brand + search
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (selectedBrand) {
      list = list.filter((p) => p.brand === selectedBrand);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const name = getProductName(p).toLowerCase();
        return name.includes(q) || p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q));
      });
    }
    return list.slice(0, 30);
  }, [products, selectedCategory, selectedBrand, search, getProductName]);

  const basketProducts = products.filter((p) => basketIds.includes(p.id));
  const displayCategories = categories.filter((c) => c !== "All");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold text-xl text-foreground">{t("basket.title")}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{t("basket.description")}</p>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add..."
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => { setSelectedCategory("All"); setSelectedBrand(null); }}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            selectedCategory === "All"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card text-muted-foreground border border-border hover:border-primary/30"
          }`}
        >
          All
        </button>
        {displayCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); setSelectedBrand(null); }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground border border-border hover:border-primary/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Brand filter toggle + dropdown */}
      {availableBrands.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowBrandFilter(!showBrandFilter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              selectedBrand
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-card text-muted-foreground border border-border hover:border-primary/30"
            }`}
          >
            <Filter className="h-3 w-3" />
            {selectedBrand || "Brand"}
            {showBrandFilter ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showBrandFilter && (
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto rounded-xl border border-border bg-card p-2">
              <button
                onClick={() => { setSelectedBrand(null); setShowBrandFilter(false); }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                  !selectedBrand ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All Brands
              </button>
              {availableBrands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => { setSelectedBrand(brand); setShowBrandFilter(false); }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    selectedBrand === brand ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filteredProducts.length === 0 ? (
          <p className="text-xs text-muted-foreground p-3 text-center">No products found</p>
        ) : (
          filteredProducts.map((p) => {
            const inBasket = basketIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-border/50 last:border-b-0 transition-colors ${
                  inBasket ? "bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <span className="text-lg">{p.image}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground truncate block">{getProductName(p)}</span>
                  {p.brand && <span className="text-[10px] text-muted-foreground">{p.brand}</span>}
                </div>
                {inBasket ? (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Selected items chips */}
      {basketProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {basketProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 transition-all active:scale-95"
            >
              <span>{p.image}</span>
              {getProductName(p)}
              <X className="h-3 w-3 ml-0.5" />
            </button>
          ))}
        </div>
      )}

      {/* Store comparison results */}
      <SmartBasketResults results={results} />
    </div>
  );
};

export default SmartBasket;
