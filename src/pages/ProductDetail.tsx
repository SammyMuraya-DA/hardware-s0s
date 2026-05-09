import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Loader2, ShoppingCart, Star, Truck, ShieldCheck, RotateCcw, Zap, ChevronRight, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Product, formatKSh } from '@/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { toast } from 'sonner';

const categoryEmoji: Record<string, string> = {
  'Tools & Hardware': '🔨', 'Plumbing': '🚿', 'Steel & Metal': '🏗️', 'Paints & Finishes': '🎨',
  'Nails & Fasteners': '🔩', 'Boards & Timber': '🪵', 'Roofing': '🏠', 'Building Materials': '🧱',
  'Fencing & Wire': '🔗', 'Cement & Building': '🏛️', 'Electrical': '⚡', 'Glass': '🪟',
  'Adhesives & Sealants': '🧴',
};

const ProductDetail = () => {
  const { slug = '' } = useParams();
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
      return data as Product | null;
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ['related', product?.category],
    enabled: !!product,
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category', product!.category)
        .neq('id', product!.id)
        .limit(8);
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg font-bold mb-3">Product not found</p>
        <Link to="/products" className="text-primary underline">Back to products</Link>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.name,
    brand: product.brand || 'SOS Hardware & Glassmart',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KES',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <Helmet>
        <title>{product.name} | SOS Hardware & Glassmart</title>
        <meta
          name="description"
          content={(product.description || product.name).slice(0, 158)}
        />
        <link rel="canonical" href={`https://soshardwareandglassmart.com/product/${slug}`} />
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-4 md:py-6">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-primary">
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-lg p-4 md:p-6">
          {/* Gallery */}
          <div className="aspect-square bg-background rounded flex items-center justify-center text-9xl">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-contain"
              />
            ) : (
              <span aria-hidden>{categoryEmoji[product.category] || '📦'}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.brand && (
              <p className="text-xs text-muted-foreground">Brand: <span className="text-primary font-medium">{product.brand}</span></p>
            )}
            <h1 className="text-xl md:text-2xl font-bold mt-1 leading-snug">{product.name}</h1>

            {Number(product.rating) > 0 && (
              <div className="flex items-center gap-1 mt-2 text-sm">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="font-medium">{Number(product.rating).toFixed(1)}</span>
                <span className="text-muted-foreground">({product.review_count} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-2xl md:text-3xl font-extrabold text-foreground">{formatKSh(product.price)}</span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-muted-foreground line-through">{formatKSh(Number(product.original_price))}</span>
                  <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
                    -{product.discount}%
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {product.is_express && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">
                  <Zap className="w-3 h-3" /> Express Delivery
                </span>
              )}
              {product.is_genuine && (
                <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-2 py-1 rounded">
                  <ShieldCheck className="w-3 h-3" /> Genuine Product
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-background border border-border text-xs px-2 py-1 rounded">
                <RotateCcw className="w-3 h-3" /> 7-Day Returns
              </span>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="inline-flex items-center border border-border rounded">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease" className="w-9 h-9 flex items-center justify-center hover:bg-background">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} aria-label="Increase" className="w-9 h-9 flex items-center justify-center hover:bg-background">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                disabled={product.stock <= 0}
                onClick={() => {
                  for (let i = 0; i < qty; i++) addItem(product);
                  toast.success(`${qty} × ${product.name} added to cart`);
                }}
                className="flex-1 h-11 bg-primary hover:bg-primary-dark disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold rounded inline-flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
              <button
                onClick={() => toggle(product)}
                aria-label="Toggle wishlist"
                className="w-11 h-11 border border-border rounded inline-flex items-center justify-center hover:bg-background"
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-primary text-primary' : ''}`} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-[11px] text-center border-t border-border pt-4">
              <div className="flex flex-col items-center gap-1"><Truck className="w-4 h-4 text-primary" /><span>Free delivery in Nyeri 5K+</span></div>
              <div className="flex flex-col items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /><span>Secure M-Pesa checkout</span></div>
              <div className="flex flex-col items-center gap-1"><RotateCcw className="w-4 h-4 text-primary" /><span>7-day returns</span></div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-4">
              Sold by: <span className="font-semibold text-foreground">SOS Hardware & Glassmart</span> · Verified Seller
            </p>
          </div>
        </div>

        {product.description && (
          <section className="bg-card border border-border rounded-lg p-4 md:p-6 mt-4">
            <h2 className="font-bold mb-2">Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
          </section>
        )}

        {related.length > 0 && (
          <section className="bg-card border border-border rounded-lg p-4 md:p-6 mt-4">
            <h2 className="font-bold mb-3">Related Products</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {related.map(p => (
                <div key={p.id} className="shrink-0 w-44">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default ProductDetail;