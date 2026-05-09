import { useCart } from '@/context/CartContext';
import { formatKSh } from '@/types';
import { Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const categoryEmoji: Record<string, string> = {
  'Tools & Hardware': '🔨', 'Plumbing': '🚿', 'Glass': '🪟', 'Electrical': '⚡',
  'Paints & Finishes': '🎨', 'Steel & Metal': '🏗️', 'Roofing': '🏠',
};

const Cart = () => {
  const { items, updateQuantity, removeItem, subtotal, vat, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <span className="text-6xl mb-4 block" aria-hidden>🛒</span>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Browse our products and add items to your cart.</p>
        <Link to="/products" className="inline-flex h-10 px-5 items-center bg-primary hover:bg-primary-dark text-primary-foreground rounded font-semibold text-sm">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Cart ({items.length})</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg divide-y divide-border">
          {items.map(item => (
            <div key={item.product.id} className="p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-background rounded flex items-center justify-center text-2xl shrink-0">
                {categoryEmoji[item.product.category] || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2">{item.product.name}</h3>
                <p className="text-[11px] text-muted-foreground">{item.product.category}</p>
                <p className="font-bold text-foreground text-sm mt-1">{formatKSh(item.product.price)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="inline-flex items-center border border-border rounded">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label="Decrease" className="w-7 h-7 flex items-center justify-center hover:bg-background">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} aria-label="Increase" className="w-7 h-7 flex items-center justify-center hover:bg-background">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.product.id)} aria-label="Remove" className="text-destructive text-xs flex items-center gap-1 hover:underline">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="bg-card border border-border rounded-lg p-5 h-fit lg:sticky lg:top-32">
          <h2 className="font-bold mb-3">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatKSh(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAT (16%)</span><span>{formatKSh(vat)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-success font-medium">Calculated at checkout</span></div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-base">
              <span>Total</span><span className="text-foreground">{formatKSh(total)}</span>
            </div>
          </div>
          <Link to="/checkout" className="mt-4 block w-full text-center h-11 leading-[44px] bg-primary hover:bg-primary-dark text-primary-foreground rounded font-semibold text-sm">
            Proceed to Checkout
          </Link>
          <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3 h-3 text-success" /> Secure Checkout
          </p>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
