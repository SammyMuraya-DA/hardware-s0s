import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X, Sparkles, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import { useProducts, useCategories, formatPrice } from "@/hooks/useProducts";
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
    const result = [...allProducts];

    let matched = result;

    if (search) {
      const q = search.toLowerCase();
      matched = matched.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
      );
    }
    if (selectedCategory) matched = matched.filter((p) => p.category_id === selectedCategory);
    if (inStockOnly) matched = matched.filter((p) => p.stock_quantity > 0);
    if (onOfferOnly) matched = matched.filter((p) => p.is_on_offer);

    switch (sortBy) {
      case "price-asc":
        matched.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        matched.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        matched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        matched.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
    }

    return matched;
  }, [allProducts, search, selectedCategory, sortBy, inStockOnly, onOfferOnly]);

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return allProducts
      .filter((p) =>
        p.name.toLowerCase().includes(query) ||
        (p.brand || "").toLowerCase().includes(query) ||
        (p.sku || "").toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [allProducts, search]);

  const activeFilterCount = [selectedCategory, inStockOnly, onOfferOnly].filter(Boolean).length;

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setInStockOnly(false);
    setOnOfferOnly(false);
    setSortBy("featured");
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <section className="border-b border-border bg-surface/40">
        <div className="container py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end"
          >
            <div className="max-w-2xl">
              <p className="label-caps text-primary mb-3">Hardware catalogue</p>
              <h1 className="font-heading text-3xl font-bold tracking-tight md:text-5xl">
                Find reliable products for every build, repair, and fit-out.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Browse trusted hardware, glass, roofing, plumbing, fittings, and site essentials with quick search,
                clear availability, and fast WhatsApp support when you need help choosing.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground md:text-sm">
                <div className="glass-card flex items-center gap-2 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Trusted quality stock
                </div>
                <div className="glass-card flex items-center gap-2 px-3 py-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Pickup & delivery options
                </div>
                <div className="glass-card flex items-center gap-2 px-3 py-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Featured deals updated regularly
                </div>
              </div>
            </div>

            <div className="glass-card p-4 md:p-5">
              <div className="relative">
                <Search className="absolute left-4 top-4 z-10 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search locks, glass, roofing sheets, pipes..."
                  className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                    {suggestions.map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.slug}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {product.brand || "SOS Hardware"} {product.sku ? `• ${product.sku}` : ""}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-sm text-primary">{formatPrice(product.price)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                  {isLoading ? "Loading products..." : `${allProducts.length} products available across ${categories.length} categories`}
                </p>
                {(search || activeFilterCount > 0 || sortBy !== "featured") && (
                  <button onClick={resetFilters} className="font-medium text-primary transition-colors hover:text-primary/80">
                    Clear search & filters
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-8 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className={`lg:w-72 lg:flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="glass-card sticky top-24 space-y-6 p-5">
              <div className="flex items-center justify-between lg:hidden">
                <h3 className="font-heading font-bold">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="label-caps text-muted-foreground">Categories</h4>
                  {selectedCategory && (
                    <button onClick={() => setSelectedCategory(null)} className="text-xs text-primary hover:underline">
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      !selectedCategory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="label-caps mb-3 text-muted-foreground">Availability</h4>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    In Stock Only
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={onOfferOnly}
                      onChange={(e) => setOnOfferOnly(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    On Offer Only
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/40 p-4">
                <p className="label-caps mb-2 text-muted-foreground">Need help choosing?</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Chat with our team for guidance on sizing, compatibility, stock checks, and bulk orders.
                </p>
                <a
                  href="https://wa.me/254707209775"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Showing {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedCategory
                    ? "Filtered by your selected category and preferences."
                    : "Explore featured picks, new arrivals, and everyday bestsellers."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {isLoading
                ? Array(6)
                    .fill(null)
                    .map((_, i) => <SkeletonCard key={i} />)
                : filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>

            {!isLoading && filtered.length === 0 && (
              <div className="glass-card mt-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2">
                  <PackageSearch className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-foreground">No products matched your search</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  Try adjusting your keywords, removing some filters, or browse all products to discover available stock.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={resetFilters}
                    className="rounded-lg bg-primary px-5 py-3 text-sm font-heading font-bold text-primary-foreground transition hover:bg-amber-light"
                  >
                    Clear all filters
                  </button>
                  <Link
                    to="/offers"
                    className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    View current offers
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;