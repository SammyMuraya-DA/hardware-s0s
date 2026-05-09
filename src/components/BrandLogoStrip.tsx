import { BRANDS } from '@/types';

const BrandLogoStrip = () => (
  <section aria-labelledby="brands-title" className="bg-card rounded-lg border border-border p-4">
    <h2 id="brands-title" className="font-bold text-base mb-3">Top Brands</h2>
    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
      {BRANDS.map(b => (
        <div
          key={b}
          className="shrink-0 w-32 h-16 rounded border border-border flex items-center justify-center bg-background text-foreground font-extrabold tracking-tight"
        >
          {b}
        </div>
      ))}
    </div>
  </section>
);

export default BrandLogoStrip;