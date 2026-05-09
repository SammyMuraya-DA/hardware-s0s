import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import { CATEGORIES } from '@/types';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 24;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || 'All';
  const initialQ = searchParams.get('q') || '';
  const [category, setCategory] = useState(initialCat);
  const [search, setSearch] = useState(initialQ);
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [page, setPage] = useState(1);

  // Sync state when URL params change (e.g. user clicks a category link from Navbar)
  useEffect(() => {
    const c = searchParams.get('category') || 'All';
    const q = searchParams.get('q') || '';
    setCategory(c);
    setSearch(q);
    setPage(1);
  }, [searchParams]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    let list = products;
    if (category !== 'All') list = list.filter(p => p.category === category);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, search, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  const handleCat = (c: string) => {
    setCategory(c);
    setPage(1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (c === 'All') next.delete('category');
      else next.set('category', c);
      return next;
    }, { replace: true });
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleSort = (val: string) => {
    setSort(val as typeof sort);
    setPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Our Products</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} products</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => handleSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={sort} onChange={e => handleSort(e.target.value)} className="px-3 py-2 rounded-lg border bg-card text-sm">
          <option value="default">Sort by</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => handleCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No products found.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginated.map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {getPageNumbers().map((p, i) =>
                  p === 'ellipsis' ? (
                    <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={page === p} onClick={() => setPage(p as number)} className="cursor-pointer">
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
