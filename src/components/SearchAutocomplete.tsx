import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Loader2, ShoppingCart, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product, formatKSh, slugify } from '@/types';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

const SearchAutocomplete = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  // Debounced search
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%`)
        .order('stock', { ascending: false })
        .order('rating', { ascending: false })
        .limit(8);
      setResults((data ?? []) as Product[]);
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    navigate(`/products?q=${encodeURIComponent(term)}`);
  };

  const goToProduct = (p: Product) => {
    setOpen(false);
    setQ('');
    const slug = p.slug || slugify(p.name) + '-' + p.id.slice(0, 6);
    navigate(`/product/${slug}`);
  };

  const handleAdd = (e: React.MouseEvent, p: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.stock <= 0) return;
    addItem(p);
    toast.success(`${p.name} added to cart`);
  };

  return (
    <div ref={containerRef} className="flex-1 max-w-2xl relative">
      <form
        onSubmit={submit}
        className="flex items-center h-10 bg-background border border-border rounded overflow-hidden focus-within:border-primary"
      >
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          type="search"
          placeholder="Search products, brands and categories…"
          aria-label="Search products"
          maxLength={120}
          className="flex-1 px-3 h-full bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="h-full px-4 bg-primary text-primary-foreground hover:bg-primary-dark transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-[70vh] overflow-y-auto z-50">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No products match "{q}"</p>
          ) : (
            <>
              <div className="px-3 py-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-secondary/40 border-b border-border">
                Top {results.length} matches
              </div>
              <ul>
                {results.map((p) => (
                  <li key={p.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => goToProduct(p)}
                      onKeyDown={(e) => { if (e.key === 'Enter') goToProduct(p); }}
                      className="w-full text-left flex gap-3 p-3 hover:bg-secondary/50 border-b border-border last:border-0 cursor-pointer"
                    >
                      <div className="w-14 h-14 shrink-0 bg-secondary rounded overflow-hidden flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                          <span className="text-sm font-bold text-primary whitespace-nowrap">{formatKSh(Number(p.price))}</span>
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {p.stock > 0 ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {p.stock > 10 ? 'In Stock' : `Only ${p.stock} left`}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                              Out of Stock
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">· {p.category}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleAdd(e, p)}
                        disabled={p.stock <= 0}
                        aria-label={`Add ${p.name} to cart`}
                        className="self-center shrink-0 h-9 px-3 rounded bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary-dark disabled:bg-muted disabled:text-muted-foreground transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to={`/products?q=${encodeURIComponent(q.trim())}`}
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-medium text-primary py-3 border-t border-border hover:bg-secondary/30"
              >
                See all results for "{q.trim()}" →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;