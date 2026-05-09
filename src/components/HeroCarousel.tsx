import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Slide = {
  title: string;
  sub: string;
  cta: string;
  to: string;
  bg: string;
  emoji: string;
  image?: string | null;
};

const fallbackSlides: Slide[] = [
  {
    title: 'Flash Sale Today',
    sub: 'Up to 30% off power tools & glass',
    cta: 'Shop Deals',
    to: '/products?category=All',
    bg: 'linear-gradient(135deg, hsl(28 92% 54%), hsl(30 89% 45%))',
    emoji: '⚡',
  },
  {
    title: 'Top Brands, Genuine Quality',
    sub: 'Bosch · Stanley · Dewalt · Crown · Sadolin',
    cta: 'Browse Brands',
    to: '/products',
    bg: 'linear-gradient(135deg, hsl(240 30% 14%), hsl(240 40% 26%))',
    emoji: '🛠️',
  },
  {
    title: 'Free Delivery in Nyeri',
    sub: 'On all orders over KES 5,000',
    cta: 'Order Now',
    to: '/products',
    bg: 'linear-gradient(135deg, hsl(145 63% 32%), hsl(145 60% 22%))',
    emoji: '🚚',
  },
];

const HeroCarousel = () => {
  const { data: offers } = useQuery({
    queryKey: ['active-offers'],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', nowIso)
        .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
        .order('starts_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const slides: Slide[] = offers && offers.length > 0
    ? offers.map((o, idx) => ({
        title: o.title,
        sub: o.description || (o.discount_percent ? `Save up to ${o.discount_percent}%` : 'Limited-time offer'),
        cta: 'Shop Offer',
        to: '/products',
        bg: fallbackSlides[idx % fallbackSlides.length].bg,
        emoji: fallbackSlides[idx % fallbackSlides.length].emoji,
        image: o.banner_url,
      }))
    : fallbackSlides;

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  // Reset index if slides change length
  useEffect(() => {
    setI(0);
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setI(p => (p + 1) % slides.length), 7000);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  const prev = () => setI(p => (p - 1 + slides.length) % slides.length);
  const next = () => setI(p => (p + 1) % slides.length);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div
        className="md:col-span-3 relative h-52 md:h-72 rounded-lg overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchStart.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (dx > 40) prev();
          else if (dx < -40) next();
          touchStart.current = null;
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Promotional banners"
      >
        <div
          className="absolute inset-0 flex h-full w-full will-change-transform"
          style={{
            transform: `translate3d(-${i * 100}%, 0, 0)`,
            transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {slides.map((s, idx) => (
            <Link
              key={s.title}
              to={s.to}
              className="relative flex-shrink-0 w-full h-full flex items-center px-6 md:px-12 text-white overflow-hidden"
              style={{ background: s.bg }}
              aria-hidden={idx !== i}
              tabIndex={idx === i ? 0 : -1}
            >
              {s.image && (
                <img
                  src={s.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="max-w-md relative z-10">
                <h2 className="text-2xl md:text-4xl font-extrabold leading-tight">{s.title}</h2>
                <p className="mt-2 text-sm md:text-base opacity-90">{s.sub}</p>
                <span className="inline-block mt-4 px-4 h-9 leading-9 rounded bg-white text-foreground text-sm font-semibold">
                  {s.cta}
                </span>
              </div>
              <div className="ml-auto text-7xl md:text-9xl opacity-60 hidden sm:block relative z-10" aria-hidden>
                {s.emoji}
              </div>
            </Link>
          ))}
        </div>

        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-foreground flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-foreground flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? 'w-6 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="hidden md:flex flex-col gap-3">
        <Link
          to="/products?category=Glass"
          className="flex-1 rounded-lg p-5 bg-card border border-border flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <p className="text-xs text-primary font-semibold">Featured</p>
            <p className="font-bold text-foreground mt-1">Glass & Mirrors</p>
            <p className="text-xs text-muted-foreground mt-1">Custom cuts available</p>
          </div>
          <span className="text-3xl self-end" aria-hidden>🪟</span>
        </Link>
        <Link
          to="/quote"
          className="flex-1 rounded-lg p-5 bg-steel text-white flex flex-col justify-between hover:opacity-95"
        >
          <div>
            <p className="text-xs text-primary font-semibold">Need a quote?</p>
            <p className="font-bold mt-1">Bulk & Project Pricing</p>
            <p className="text-xs opacity-80 mt-1">Get back within 24h</p>
          </div>
          <span className="text-3xl self-end" aria-hidden>📋</span>
        </Link>
      </div>
    </div>
  );
};

export default HeroCarousel;