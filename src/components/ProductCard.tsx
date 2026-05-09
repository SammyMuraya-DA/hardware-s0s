import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Product, formatKSh, slugify } from '@/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Heart, Star, Zap, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const categoryEmoji: Record<string, string> = {
  'Tools & Hardware': '🔨', 'Plumbing': '🚿', 'Steel & Metal': '🏗️', 'Paints & Finishes': '🎨',
  'Nails & Fasteners': '🔩', 'Boards & Timber': '🪵', 'Roofing': '🏠', 'Building Materials': '🧱',
  'Fencing & Wire': '🔗', 'Cement & Building': '🏛️', 'Electrical': '⚡', 'Glass': '🪟',
  'Adhesives & Sealants': '🧴',
};

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const slug = product.slug || slugify(product.name) + '-' + product.id.slice(0, 6);
  const discount = product.discount || 0;
  const rating = Number(product.rating) || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  };

  return (
    <Link
      to={`/product/${slug}`}
      className="group relative flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Discount badge */}
      {discount > 0 && (
        <span className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
          -{discount}%
        </span>
      )}

      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-card/90 backdrop-blur flex items-center justify-center hover:bg-card transition-colors"
      >
        <Heart
          className={`w-4 h-4 ${wishlisted ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
        />
      </button>

      {/* Image */}
      <div className="aspect-square bg-card flex items-center justify-center p-2 text-5xl">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            width={300}
            height={300}
            className="w-full h-full object-contain"
          />
        ) : (
          <span aria-hidden>{categoryEmoji[product.category] || '📦'}</span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {product.is_express && (
          <span className="inline-flex items-center gap-1 self-start bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded">
            <Zap className="w-3 h-3" /> Express
          </span>
        )}

        <h3 className="text-[13px] text-foreground line-clamp-2 leading-snug min-h-[34px]">
          {product.name}
        </h3>

        {rating > 0 && (
          <div className="flex items-center gap-1 text-[11px]">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({product.review_count || 0})</span>
          </div>
        )}

        <div className="flex items-baseline gap-2 mt-auto">
          <span className="font-bold text-[15px] text-foreground">{formatKSh(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-[12px] text-muted-foreground line-through">
              {formatKSh(Number(product.original_price))}
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className="mt-2 w-full h-9 rounded bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary-dark disabled:bg-muted disabled:text-muted-foreground transition-colors md:opacity-0 md:group-hover:opacity-100 md:transition-opacity"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </Link>
  );
};

export default memo(ProductCard, (prev, next) => prev.product === next.product);
