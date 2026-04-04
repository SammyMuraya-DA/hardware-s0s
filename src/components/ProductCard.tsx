import { DbProduct, formatPrice, getStockStatus } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";
import { ShoppingCart, Heart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: DbProduct;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore(s => s.addItem);
  const openCart = useCartStore(s => s.openCart);
  const stockStatus = getStockStatus(product);
  const isOutOfStock = stockStatus === "out_of_stock";
  const isLowStock = stockStatus === "low_stock";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product);
    openCart();
    toast({ title: "Added to cart!", description: product.name });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <Link
        to={`/products/${product.slug}`}
        className={`group block glass-card overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:amber-glow ${isOutOfStock ? "opacity-60" : ""}`}
      >
        <div className="relative aspect-square bg-surface-2 overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                <Eye className="w-8 h-8 text-muted-foreground/40" />
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.is_new_arrival && (
              <span className="label-caps px-2 py-0.5 bg-primary text-primary-foreground rounded-sm text-[10px]">NEW</span>
            )}
            {product.is_on_offer && product.offer_label && (
              <span className="label-caps px-2 py-0.5 bg-warning text-warning-foreground rounded-sm text-[10px]">{product.offer_label}</span>
            )}
            {product.is_best_seller && (
              <span className="label-caps px-2 py-0.5 bg-secondary text-secondary-foreground rounded-sm text-[10px]">BEST SELLER</span>
            )}
            {isOutOfStock && (
              <span className="label-caps px-2 py-0.5 bg-destructive text-destructive-foreground rounded-sm text-[10px]">OUT OF STOCK</span>
            )}
          </div>

          <button
            className="absolute top-3 right-3 p-1.5 rounded-full bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <Heart className="w-4 h-4 text-foreground" />
          </button>

          {!isOutOfStock && (
            <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
              <button
                onClick={handleAddToCart}
                className="w-full py-2 text-sm font-medium bg-background/90 backdrop-blur-sm text-primary rounded-md hover:bg-background transition-colors"
              >
                Quick Add
              </button>
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="label-caps text-muted-foreground mb-1">
            {product.brand || "SOS"} · {product.sku}
          </p>
          <h3 className="font-heading font-semibold text-foreground text-sm leading-tight mb-2 line-clamp-2">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono-price text-primary text-lg">{formatPrice(product.price)}</span>
            {product.original_price && (
              <span className="font-mono text-sm text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-3">{product.unit}</p>

          <div className="flex items-center gap-1.5 mb-3">
            <span className={`w-2 h-2 rounded-full ${
              isOutOfStock ? "bg-destructive" : isLowStock ? "bg-warning animate-pulse-amber" : "bg-success"
            }`} />
            <span className={`text-xs ${
              isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-success"
            }`}>
              {isOutOfStock ? "OUT OF STOCK" : isLowStock ? `Only ${product.stock_quantity} Left!` : `In Stock (${product.stock_quantity})`}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-amber-light"
          >
            <ShoppingCart className="w-4 h-4" />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
