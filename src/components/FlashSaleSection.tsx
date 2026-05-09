import { useEffect, useState, memo } from 'react';
import { Zap } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';

const useDailyCountdown = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diff = Math.max(0, next.getTime() - now.getTime());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const CountdownBadge = () => {
  const time = useDailyCountdown();

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="hidden sm:inline opacity-90">Ends in</span>
      <span className="font-mono font-bold bg-foreground/20 px-2 py-0.5 rounded tabular-nums">
        {time}
      </span>
    </div>
  );
};

const FlashSaleSection = ({ products }: { products: Product[] }) => {
  if (!products.length) return null;

  return (
    <section aria-labelledby="flash-sale-title" className="bg-card rounded-lg overflow-hidden border border-border">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-destructive text-destructive-foreground">
        <h2 id="flash-sale-title" className="flex items-center gap-2 font-bold text-sm md:text-base">
          <Zap className="w-4 h-4 fill-current" />
          Flash Sale
        </h2>
        <CountdownBadge />
      </header>

      <div
        className="flex gap-3 overflow-x-auto p-3 scrollbar-hide snap-x snap-mandatory"
        style={{ touchAction: 'pan-x' }}
      >
        {products.map(p => (
          <div key={p.id} className="snap-start shrink-0 w-44 md:w-52">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default memo(FlashSaleSection, (prev, next) => prev.products === next.products);