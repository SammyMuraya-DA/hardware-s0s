import { useParams, Link } from "react-router-dom";
import { useProductBySlug, useProducts, formatPrice, getStockStatus } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, Zap, MessageCircle, Minus, Plus, ChevronDown, MapPin, Truck, Shield, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProductBySlug(slug || "");
  const { data: allProducts = [] } = useProducts();
  const addItem = useCartStore(s => s.addItem);
  const openCart = useCartStore(s => s.openCart);
  const [qty, setQty] = useState(1);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container py-10">
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="aspect-square shimmer rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 w-24 shimmer rounded" />
              <div className="h-8 w-3/4 shimmer rounded" />
              <div className="h-10 w-32 shimmer rounded" />
              <div className="h-12 w-full shimmer rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">Product not found</h1>
          <Link to="/products" className="text-primary hover:underline">← Back to products</Link>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product);
  const isOutOfStock = stockStatus === "out_of_stock";
  const isLowStock = stockStatus === "low_stock";
  const related = allProducts.filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);
  const specs = product.specifications as Record<string, string> | null;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, qty);
    openCart();
    toast({ title: "Added to cart!", description: `${qty}× ${product.name}` });
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="container py-6">
        <p className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-foreground">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </p>

        <div className="grid lg:grid-cols-2 gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card aspect-square relative overflow-hidden bg-surface-2">
            {product.images && product.images.length > 0 ? (
              <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <Eye className="w-24 h-24" />
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="font-heading font-bold text-xl text-destructive">OUT OF STOCK</span>
              </div>
            )}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-14 h-14 rounded-md overflow-hidden border-2 flex-shrink-0 ${selectedImage === i ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:sticky lg:top-24 lg:self-start">
            <Link to="/products" className="label-caps text-primary hover:underline">{product.brand || "SOS Hardware"}</Link>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2 mb-1">{product.name}</h1>
            <p className="font-mono text-sm text-muted-foreground mb-4">SKU: {product.sku}</p>

            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? "bg-destructive" : isLowStock ? "bg-warning animate-pulse-amber" : "bg-success"}`} />
              <span className={`text-sm font-medium ${isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-success"}`}>
                {isOutOfStock ? "OUT OF STOCK" : isLowStock ? `LOW STOCK — Only ${product.stock_quantity} Left!` : `IN STOCK — ${product.stock_quantity} Available`}
              </span>
            </div>

            {product.is_on_offer && product.offer_label && (
              <div className="glass-card bg-primary/10 border-primary/20 px-4 py-2 mb-4 inline-block">
                <span className="text-primary font-heading font-bold text-sm">⚡ {product.offer_label}</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-mono-price text-primary text-4xl">{formatPrice(product.price)}</span>
              {product.original_price && <span className="font-mono text-lg text-muted-foreground line-through">{formatPrice(product.original_price)}</span>}
            </div>
            <p className="text-sm text-muted-foreground mb-6">{product.unit}</p>
            <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

            {!isOutOfStock && (
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-muted-foreground">Qty:</span>
                <div className="flex items-center border border-border rounded-lg">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-muted transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-12 text-center font-mono">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))} className="p-2 hover:bg-muted transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <button onClick={handleAddToCart} disabled={isOutOfStock} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-heading font-bold text-base transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed glass-card border-primary/30 text-primary hover:bg-primary/10">
                <ShoppingCart className="w-5 h-5" /> {isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
              </button>
              <button onClick={handleAddToCart} disabled={isOutOfStock} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-heading font-bold text-base transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-amber-light">
                <Zap className="w-5 h-5" /> BUY NOW
              </button>
            </div>

            <a href={`https://wa.me/254707209775?text=${encodeURIComponent(`Hi Steve, I'm interested in ${product.name} (SKU: ${product.sku})`)}`} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-sm">
              <MessageCircle className="w-4 h-4" /> Ask Steve on WhatsApp
            </a>

            <div className="mt-6 space-y-2">
              {[
                { icon: MapPin, title: "Free Pickup — Nyeri Town", id: "pickup" },
                { icon: Truck, title: "Delivery — KES 200 (Nyeri) / KES 500 (Upcountry)", id: "delivery" },
                { icon: Shield, title: "M-Pesa Accepted", id: "mpesa" },
              ].map(item => (
                <button key={item.id} onClick={() => setExpandedSection(expandedSection === item.id ? null : item.id)} className="w-full flex items-center gap-3 p-3 glass-card text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="flex-1">{item.title}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedSection === item.id ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>

            {specs && Object.keys(specs).length > 0 && (
              <div className="mt-8">
                <h3 className="font-heading font-bold text-foreground mb-3">Specifications</h3>
                <div className="glass-card overflow-hidden">
                  {Object.entries(specs).map(([key, value], i) => (
                    <div key={key} className={`flex justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-surface/50" : ""}`}>
                      <span className="text-muted-foreground">{key}</span>
                      <span className="text-foreground font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-heading text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
