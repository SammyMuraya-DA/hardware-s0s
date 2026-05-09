import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { memo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import HeroCarousel from '@/components/HeroCarousel';
import FlashSaleSection from '@/components/FlashSaleSection';
import CategoryGrid from '@/components/CategoryGrid';
import BrandLogoStrip from '@/components/BrandLogoStrip';
import ProductCard from '@/components/ProductCard';

const useProducts = (key: string, limit: number, orderBy: string) =>
  useQuery({
    queryKey: ['home', key, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order(orderBy, { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

const ProductSection = memo(({
  title,
  products,
  loading,
}: {
  title: string;
  products: ReturnType<typeof useProducts>['data'];
  loading: boolean;
}) => {
  return (
    <section aria-labelledby={`sec-${title}`} className="bg-card rounded-lg border border-border p-4">
    <div className="flex items-center justify-between mb-3">
      <h2 id={`sec-${title}`} className="font-bold text-base">{title}</h2>
      <Link to="/products" className="text-xs text-primary font-semibold hover:underline">
        See all →
      </Link>
    </div>
    {loading && !products?.length ? (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products?.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    )}
    </section>
  );
});
ProductSection.displayName = 'ProductSection';

const Index = () => {
  const flash = useProducts('flash', 12, 'discount');
  const recommended = useProducts('recommended', 20, 'rating');
  const more = useProducts('more', 20, 'created_at');

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'HardwareStore',
    name: 'SOS Hardware & Glassmart',
    image: 'https://soshardwareandglassmart.com/og.jpg',
    telephone: '+254701207207',
    email: 'glassmartkenya@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: "Nairobi Road, Ruring'u",
      addressLocality: 'Nyeri',
      addressCountry: 'KE',
    },
    openingHours: 'Mo-Sa 08:00-19:00',
  };

  return (
    <>
      <Helmet>
        <title>SOS Hardware & Glassmart | Kenya's Hardware & Glass Store</title>
        <meta
          name="description"
          content="Shop tools, glass, plumbing, electrical, paints and more from SOS Hardware & Glassmart in Nyeri. Pay via M-Pesa. Countrywide delivery."
        />
        <link rel="canonical" href="https://soshardwareandglassmart.com/" />
        <meta property="og:title" content="SOS Hardware & Glassmart" />
        <meta property="og:description" content="Quality hardware & glass · M-Pesa · Countrywide delivery" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
      </Helmet>

      <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 space-y-4">
        <HeroCarousel />
        <CategoryGrid />
        <FlashSaleSection products={flash.data ?? []} />
        <ProductSection title="Recommended For You" products={recommended.data} loading={recommended.isLoading} />
        <BrandLogoStrip />
        <ProductSection title="More To Explore" products={more.data} loading={more.isLoading} />
      </div>
    </>
  );
};

export default Index;
