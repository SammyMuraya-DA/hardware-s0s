import { NavLink } from 'react-router-dom';
import { Home, Grid3x3, Tag, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const MobileBottomNav = () => {
  const { totalItems } = useCart();
  const { user } = useAuth();

  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/products', label: 'Categories', icon: Grid3x3 },
    { to: '/products?category=All', label: 'Deals', icon: Tag },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badgeKey: 'cart' as const },
    { to: user ? '/account/orders' : '/auth', label: 'Account', icon: User },
  ];

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border h-14 grid grid-cols-5"
      style={{ touchAction: 'manipulation' }}
    >
      {items.map(({ to, label, icon: Icon, end, badgeKey }) => (
        <NavLink
          key={label}
          to={to}
          end={end}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-0.5 text-[10px] ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          {label}
          {badgeKey === 'cart' && totalItems > 0 && (
            <span className="absolute top-1.5 right-[28%] bg-primary text-primary-foreground text-[9px] font-bold min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileBottomNav;