import { create } from 'zustand';
import type { DbProduct } from '@/hooks/useProducts';

export interface CartItem {
  product: DbProduct;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: DbProduct, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  itemCount: () => number;
}

const clampQuantity = (quantity: number) => {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  addItem: (product, qty = 1) => {
    set((state) => {
      const normalizedQty = clampQuantity(qty);
      const existing = state.items.find((i) => i.product.id === product.id);

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? {
                  ...i,
                  quantity: clampQuantity(i.quantity + normalizedQty),
                }
              : i
          ),
        };
      }

      return { items: [...state.items, { product, quantity: normalizedQty }] };
    });
  },
  removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: clampQuantity(quantity) }
          : i
      ),
    })),
  clearCart: () => set({ items: [] }),
  toggleCart: () => set(state => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  total: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
