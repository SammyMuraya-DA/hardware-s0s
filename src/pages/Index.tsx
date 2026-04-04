import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Lock, Square, Home, Droplets, Wrench, Bolt, Shield, Truck, MapPin, MessageCircle } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useCategories, useFeaturedProducts, useOfferProducts, useNewArrivals, useSiteContent, formatPrice } from "@/hooks/useProducts";

const iconMap: Record<string, React.ElementType> = {
  Lock, Square, Home, Droplets, Wrench, Bolt,
};

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <div ref={ref} className="font-display text-4xl md:text-5xl text-primary">
      {count}{suffix}
    </div>
  );
}

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

const Index = () => {
  const { data: categories = [] } = useCategories();
  const { data: featured = [], isLoading: featuredLoading } = useFeaturedProducts();
  const { data: offers = [] } = useOfferProducts();
  const { data: newArrivals = [], isLoading: newLoading } = useNewArrivals();
  const { data: siteContent = {} } = useSiteContent();

  const sc = (key: string, fallback: string) => siteContent[key]?.value || fallback;
  const scImg = (key: string) => siteContent[key]?.image_url || null;

  const heroImage = scImg("hero_image");

  return (
    <div className="pb-16 lg:pb-0">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden noise-overlay">
        {heroImage ? (
          <img src={heroImage} alt="SOS Hardware store" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/40" />
        <div className="relative z-10 container py-24 md:py-32">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="label-caps text-primary mb-6 flex items-center gap-3">
                <span className="w-8 h-px bg-primary" />
                {sc("hero_subtitle", "COUNTRYWIDE TRUSTED HARDWARE PARTNER")}
              </p>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="mb-6">
              <span className="font-display text-7xl md:text-8xl lg:text-[96px] text-foreground block leading-[0.9]">{sc("hero_title_1", "BUILD")}</span>
              <span className="font-display text-7xl md:text-8xl lg:text-[96px] text-primary block leading-[0.9]">{sc("hero_title_2", "BETTER.")}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-muted-foreground text-lg max-w-md mb-8 leading-relaxed">
              {sc("hero_description", "Quality hardware, glass & fittings — shop online from Nyeri's most stocked store. Pay with M-Pesa, collect or get delivered.")}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }} className="flex flex-wrap gap-3 mb-8">
              <Link to="/products" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-heading font-bold rounded-lg hover:bg-amber-light transition-all active:scale-[0.97] amber-glow">
                SHOP NOW <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:+254707209775" className="inline-flex items-center gap-2 px-7 py-3.5 border border-primary text-primary font-heading font-bold rounded-lg hover:bg-primary/10 transition-all active:scale-[0.97]">
                CALL SOS
              </a>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              {["M-Pesa Accepted", "Free Nyeri Pickup", "Countrywide Delivery", "20+ Yrs Experience"].map(item => (
                <span key={item} className="flex items-center gap-1"><span className="text-primary">✓</span> {item}</span>
              ))}
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce-gentle">
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-surface/80 backdrop-blur-sm py-3 overflow-hidden">
          <div className="ticker-scroll flex gap-8 whitespace-nowrap">
            {Array(2).fill(null).map((_, i) => (
              <span key={i} className="flex gap-8 label-caps text-primary text-xs">
                {sc("ticker_text", "DOOR LOCKS · GLASS CUTTING · ROOFING SHEETS · PLUMBING · TOOLS · FASTENERS · PAINTS").split("·").map((t, j) => (
                  <span key={j}>{t.trim()}</span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 border-b border-border">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { target: 500, suffix: "+", label: "Products" },
            { target: 8, suffix: "", label: "Categories" },
            { target: 20, suffix: "+", label: "Years Experience" },
            { target: 4.9, suffix: "", label: "Customer Rating" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-2">WHAT ARE YOU BUILDING?</h2>
            <p className="text-muted-foreground">From foundations to finishing touches — we've got it all.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => {
              const Icon = iconMap[cat.icon || "Wrench"] || Wrench;
              const isLarge = i === 0;
              return (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className={isLarge ? "col-span-2 row-span-2" : ""}>
                  <Link to={`/category/${cat.slug}`} className={`group glass-card glass-card-hover overflow-hidden relative flex flex-col justify-end transition-all duration-300 hover:border-primary/30 ${isLarge ? "h-full min-h-[280px]" : "h-36 md:h-40"}`}>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" />
                    ) : null}
                    <div className="relative z-10 p-6">
                      <Icon className={`text-primary mb-3 ${isLarge ? "w-10 h-10" : "w-7 h-7"}`} />
                      <h3 className={`font-heading font-bold text-foreground ${isLarge ? "text-xl" : "text-sm"}`}>{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{cat.tagline}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-20 bg-surface/30">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold">FEATURED PRODUCTS</h2>
              <p className="text-muted-foreground mt-1">Handpicked by SOS Hardware & Glassmart</p>
            </div>
            <Link to="/products" className="text-primary text-sm font-medium hover:underline hidden sm:block">VIEW ALL →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredLoading
              ? Array(4).fill(null).map((_, i) => <SkeletonCard key={i} />)
              : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            }
          </div>
        </div>
      </section>

      {/* FLASH DEALS */}
      {offers.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-primary to-amber-light noise-overlay relative overflow-hidden">
          <div className="relative z-10 container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="font-display text-4xl md:text-5xl text-primary-foreground">⚡ FLASH DEALS</h2>
                <p className="text-primary-foreground/80 mt-2">Limited time offers — don't miss out</p>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {offers.map(p => (
                  <Link key={p.id} to={`/products/${p.slug}`} className="flex-shrink-0 w-64 p-4 rounded-xl bg-background/90 backdrop-blur-sm border border-border">
                    {p.images && p.images[0] && (
                      <img src={p.images[0]} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-2" />
                    )}
                    <h3 className="font-heading font-semibold text-foreground text-sm mb-2 line-clamp-2">{p.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono-price text-primary">{formatPrice(p.price)}</span>
                      {p.original_price && <span className="font-mono text-xs text-muted-foreground line-through">{formatPrice(p.original_price)}</span>}
                    </div>
                    <span className="label-caps text-warning text-[10px] mt-1 block">{p.offer_label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WHY CHOOSE US */}
      <section className="py-20">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="label-caps text-primary mb-3">BUILT ON TRUST</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">{sc("about_title", "Nyeri's Hardware Partner Since the Foundation Days")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {sc("about_description", "Steve Wanga has been supplying quality hardware, glass, and building materials to Nyeri and beyond for over 20 years.")}
              </p>
              <div className="flex gap-6">
                {[{ val: "500+", label: "Products" }, { val: "20+", label: "Years" }, { val: "KE", label: "Nationwide" }].map(s => (
                  <div key={s.label} className="text-center">
                    <span className="font-display text-2xl text-primary">{s.val}</span>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card aspect-video overflow-hidden bg-surface-2">
              {scImg("about_image") ? (
                <img src={scImg("about_image")!} alt="About SOS Hardware" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                  <div className="text-center">
                    <Shield className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">SOS Workshop</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      {(newArrivals.length > 0 || newLoading) && (
        <section className="py-20 bg-surface/30">
          <div className="container">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-heading text-3xl md:text-4xl font-bold">JUST LANDED</h2>
                <span className="label-caps px-2 py-0.5 bg-primary text-primary-foreground rounded-sm text-[10px]">NEW</span>
              </div>
              <p className="text-muted-foreground">Fresh additions to our shelves</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {newLoading
                ? Array(4).fill(null).map((_, i) => <SkeletonCard key={i} />)
                : newArrivals.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* TRUST STRIP */}
      <section className="py-16 border-y border-border">
        <div className="container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Shield, title: "Secure M-Pesa Payment", desc: "Pay safely with your Safaricom M-Pesa PIN" },
            { icon: MapPin, title: "Free Nyeri Pickup", desc: "Order online, collect from our Nyeri Town shop" },
            { icon: Truck, title: "Countrywide Delivery", desc: "We ship nationwide via courier — flat rates apply" },
            { icon: MessageCircle, title: "WhatsApp Support", desc: "Message Steve directly for quotes and advice" },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-heading font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;