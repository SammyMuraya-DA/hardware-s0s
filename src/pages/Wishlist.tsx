import { Link } from 'react-router-dom';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { Heart } from 'lucide-react';

const Wishlist = () => {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Your wishlist is empty</h1>
        <p className="text-sm text-muted-foreground mb-6">Tap the heart on any product to save it for later.</p>
        <Link to="/products" className="inline-flex h-10 px-5 items-center bg-primary hover:bg-primary-dark text-primary-foreground rounded font-semibold text-sm">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4">My Wishlist ({items.length})</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
};

export default Wishlist;