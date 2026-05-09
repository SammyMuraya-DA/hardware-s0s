import { Tables } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Order = Tables<'orders'>;
export type QuoteRequest = Tables<'quote_requests'>;

export const CATEGORIES = ['All', 'Tools & Hardware', 'Plumbing', 'Steel & Metal', 'Paints & Finishes', 'Nails & Fasteners', 'Boards & Timber', 'Roofing', 'Building Materials', 'Fencing & Wire', 'Cement & Building', 'Electrical', 'Glass', 'Adhesives & Sealants'] as const;
export type Category = typeof CATEGORIES[number];

/** Top-level categories featured in the homepage icon grid (Jumia-style). */
export const FEATURED_CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Tools & Hardware', icon: '🔨' },
  { name: 'Plumbing', icon: '🚿' },
  { name: 'Glass', icon: '🪟' },
  { name: 'Electrical', icon: '⚡' },
  { name: 'Paints & Finishes', icon: '🎨' },
  { name: 'Nails & Fasteners', icon: '🔩' },
  { name: 'Roofing', icon: '🏠' },
  { name: 'Steel & Metal', icon: '🏗️' },
  { name: 'Boards & Timber', icon: '🪵' },
  { name: 'Building Materials', icon: '🧱' },
  { name: 'Cement & Building', icon: '🏛️' },
  { name: 'Adhesives & Sealants', icon: '🧴' },
];

export const BRANDS = ['Bosch', 'Stanley', 'Dewalt', 'Crown', 'Sadolin', 'Bamburi'];

export const formatKSh = (amount: number) =>
  `KSh ${amount.toLocaleString('en-KE')}`;

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
