import { useState, useMemo } from "react";
import { ShoppingBasket } from "lucide-react";
import heroImage from "@/assets/hero-groceries.png";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import StatsBar from "@/components/StatsBar";
import { products } from "@/data/groceryData";

const Index = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingBasket className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-lg text-foreground">GrocerySaver</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <section className="relative bg-card rounded-2xl border border-border overflow-hidden p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 space-y-3">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-card-foreground leading-tight">
              Compare grocery prices.
              <br />
              <span className="text-primary">Save every trip.</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-md">
              Find the lowest prices across Walmart, Kroger, Target & Aldi — all in one place.
            </p>
          </div>
          <img
            src={heroImage}
            alt="Fresh groceries illustration"
            className="w-48 sm:w-56 object-contain"
          />
        </section>

        {/* Stats */}
        <StatsBar />

        {/* Search + Filter */}
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-foreground">
              {category === "All" ? "All Products" : category}
            </h3>
            <span className="text-sm text-muted-foreground">{filtered.length} items</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No products found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
