import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/hooks/useProducts";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[70] bg-background/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[80] w-full max-w-md bg-background border-l border-border flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-heading font-bold text-lg">
                Your Cart ({itemCount()} {itemCount() === 1 ? "item" : "items"})
              </h2>
              <button onClick={closeCart} className="p-2 rounded-md hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <ShoppingCart className="w-16 h-16 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <Link to="/products" onClick={closeCart} className="text-primary hover:underline text-sm font-medium">
                    Browse Products →
                  </Link>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.product.id} className="glass-card p-3 flex gap-3">
                    <div className="w-16 h-16 rounded-md bg-surface-2 flex-shrink-0 overflow-hidden">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-heading text-sm font-medium text-foreground truncate pr-2">
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 border border-border rounded-md overflow-hidden">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10);
                              if (!Number.isNaN(value)) {
                                updateQuantity(item.product.id, Math.max(value, 1));
                              }
                            }}
                            className="w-20 text-center py-2 bg-background text-sm font-mono focus:outline-none"
                            aria-label={`Quantity for ${item.product.name}`}
                          />
                        </div>
                        <span className="font-mono-price text-primary text-sm">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex justify-between font-heading font-bold text-lg">
                  <span>Subtotal</span>
                  <span className="font-mono-price text-primary">{formatPrice(total())}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-base hover:bg-amber-light transition-colors active:scale-[0.97]"
                >
                  Checkout — {formatPrice(total())} →
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
