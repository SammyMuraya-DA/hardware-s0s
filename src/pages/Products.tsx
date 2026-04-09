import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useProducts, useCategories, formatPrice, DbProduct } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="aspect-square shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 shimmer rounded" />
        <div className="h-4 w-full shimmer rounded" />
        <div className="h-5 w-24 shimmer rounded" />
        <div className="h-10 w-full shimmer rounded" />
      </div>
    </div>
  );
}

const Products = () => {
  const { data: allProducts = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onOfferOnly, setOnOfferOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = [...allProducts];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
      );
    }
    if (selectedCategory) result = result.filter(p => p.category_id === selectedCategory);
    if (inStockOnly) result = result.filter(p => p.stock_quantity > 0);
    if (onOfferOnly) result = result.filter(p => p.is_on_offer);

    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "newest": result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      default: result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break;
    }
    return result;
  }, [allProducts, search, selectedCategory, sortBy, inStockOnly, onOfferOnly]);

  const searchSuggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];

    return allProducts
      .filter(product =>
        product.name.toLowerCase().includes(term) ||
        (product.brand || "").toLowerCase().includes(term) ||
        (product.sku || "").toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [allProducts, search]);

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="bg-surface/50 border-b border-border">
        <div className="container py-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">ALL PRODUCTS</h1>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for locks, glass, roofing, pipes..."
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 font-body"
              aria-label="Search products"
            />

            {searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-10">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Suggested products</div>
                {searchSuggestions.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSearch(product.name)}
                    className="w-full text-left px-4 py-3 hover:bg-surface transition-colors border-t border-border"
                  >
                    <span className="block font-medium text-foreground">{product.name}</span>
                    <span className="flex items-center justify-between gap-3 text-sm text-muted-foreground mt-1">
                      <span>{product.brand || product.sku}</span>
                      <span className="font-semibold text-foreground">{formatPrice(product.price)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="glass-card p-5 space-y-6 sticky top-24">
              <div className="flex items-center justify-between lg:hidden">
                <h3 className="font-heading font-bold">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
              </div>
              <div>
                <h4 className="label-caps text-muted-foreground mb-3">Categories</h4>
                <div className="space-y-2">
                  <button onClick={() => setSelectedCategory(null)} className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${!selectedCategory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    All Products
                  </button>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${selectedCategory === cat.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="label-caps text-muted-foreground mb-3">Availability</h4>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer mb-2">
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
                  In Stock Only
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={onOfferOnly} onChange={(e) => setOnOfferOnly(e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
                  On Offer Only
                </label>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">Showing {filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {isLoading
                ? Array(6).fill(null).map((_, i) => <SkeletonCard key={i} />)
                : filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              }
            </div>

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No products found</p>
                <button onClick={() => { setSearch(""); setSelectedCategory(null); setInStockOnly(false); setOnOfferOnly(false); }} className="text-primary mt-2 text-sm hover:underline">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
