import { Link, NavLink } from 'react-router-dom';
import { Heart, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import AnnouncementBar from './AnnouncementBar';
import SearchAutocomplete from './SearchAutocomplete';
import logo from '@/assets/logo.png';

const navLinks = [
  { to: '/products?category=All', label: 'Deals' },
  { to: '/products', label: 'New Arrivals' },
  { to: '/products?category=Tools+%26+Hardware', label: 'Power Tools' },
  { to: '/products?category=Glass', label: 'Glass' },
  { to: '/products?category=Plumbing', label: 'Plumbing' },
  { to: '/products?category=Electrical', label: 'Electrical' },
  { to: '/products?category=Paints+%26+Finishes', label: 'Paints' },
];

const Navbar = () => {
  const { totalItems } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      {/* Main header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 h-24 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="SOS Hardware & Glassmart home">
            <div className="relative rounded-full p-2 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
              <img src={logo} alt="SOS Hardware & Glassmart logo" className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 object-contain" />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="block font-extrabold text-lg md:text-xl text-foreground">SOS Hardware</span>
              <span className="block text-sm text-muted-foreground">& Glassmart</span>
            </div>
          </Link>

          {/* Search */}
          <SearchAutocomplete />

          {/* Actions */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            {user ? (
              <>
                <Link
                  to="/account/orders"
                  className="flex items-center gap-1.5 px-3 py-2 rounded hover:bg-background"
                >
                  <Package className="w-4 h-4" />
                  <span className="text-xs">Orders</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded hover:bg-background"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs">Sign out</span>
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-2 rounded hover:bg-background"
              >
                <User className="w-4 h-4" />
                <span className="text-xs">Sign in</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-2 rounded hover:bg-background text-primary"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-xs">Admin</span>
              </Link>
            )}
            <Link
              to="/wishlist"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded hover:bg-background"
            >
              <Heart className="w-4 h-4" />
              <span className="text-xs">Wishlist</span>
              {wishCount > 0 && (
                <span className="absolute -top-0.5 right-1 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishCount}
                </span>
              )}
            </Link>
          </div>

          <Link
            to="/cart"
            aria-label={`Cart with ${totalItems} items`}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded hover:bg-background"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden md:inline text-xs">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 right-1 bg-primary text-primary-foreground text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menu"
            className="md:hidden p-2"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="px-4 py-2 flex flex-col text-sm">
              {user ? (
                <>
                  <Link to="/account/orders" onClick={() => setMobileOpen(false)} className="py-2">My Orders</Link>
                  <button onClick={() => { setMobileOpen(false); signOut(); }} className="py-2 text-left">Sign out</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="py-2">Sign in / Register</Link>
              )}
              <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="py-2">Wishlist</Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="py-2">Contact</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="py-2 text-primary font-medium">Admin Dashboard</Link>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Category nav (desktop/tablet) */}
      <nav className="bg-steel text-steel-foreground hidden sm:block">
        <div className="container mx-auto px-4 h-10 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Link
            to="/products"
            className="shrink-0 bg-primary hover:bg-primary-dark text-primary-foreground text-xs font-semibold px-3 h-7 rounded inline-flex items-center gap-1.5"
          >
            <Menu className="w-3.5 h-3.5" />
            All Categories
          </Link>
          {navLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `shrink-0 text-xs px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
                  isActive ? 'text-primary' : 'text-steel-foreground/90 hover:text-primary'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
