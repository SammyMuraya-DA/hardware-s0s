import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FEATURED_CATEGORIES } from '@/types';

const CategoryGrid = () => {
  const { data } = useQuery({
    queryKey: ['active-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name, icon')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const cats = data && data.length > 0
    ? data.map(c => ({ name: c.name, icon: c.icon || '📦' }))
    : FEATURED_CATEGORIES;

  return (
    <section aria-labelledby="cats-title" className="bg-card rounded-lg border border-border p-4">
      <h2 id="cats-title" className="font-bold text-base mb-3">Shop by Category</h2>
      <div className="flex sm:grid sm:grid-cols-6 gap-3 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-1 px-1">
        {cats.map(c => (
          <Link
            key={c.name}
            to={`/products?category=${encodeURIComponent(c.name)}`}
            className="shrink-0 sm:shrink flex flex-col items-center justify-center text-center group"
          >
            <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background flex items-center justify-center text-2xl sm:text-3xl border border-border group-hover:border-primary group-hover:bg-primary/5 transition-colors">
              {c.icon}
            </span>
            <span className="block text-[11px] sm:text-xs text-foreground mt-2 max-w-[80px] leading-tight">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
