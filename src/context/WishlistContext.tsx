import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Product } from '@/types';

interface WishlistContextType {
  items: Product[];
  toggle: (product: Product) => void;
  isWishlisted: (id: string) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('sos-wishlist') : null;
      return raw ? (JSON.parse(raw) as Product[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sos-wishlist', JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const toggle = useCallback((product: Product) => {
    setItems(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
  }, []);

  const isWishlisted = useCallback(
    (id: string) => items.some(p => p.id === id),
    [items]
  );

  return (
    <WishlistContext.Provider value={{ items, toggle, isWishlisted, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};