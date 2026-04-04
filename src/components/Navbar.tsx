import { ShoppingCart, Phone, Menu, Search, X, Home, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteContent } from "@/hooks/useProducts";

const navLinks = [
  { label: "All Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const itemCount = useCartStore(s => s.itemCount());
  const openCart = useCartStore(s => s.openCart);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountHref = user ? "/account" : "/login";
  const { data: siteContent = {} } = useSiteContent();

  const logoText = siteContent["logo_text"]?.value || "SOS HARDWARE";
  const logoSubtitle = siteContent["logo_subtitle"]?.value || "NYERI";
  const logoImage = siteContent["logo_text"]?.image_url;

  return (
    <>
      {/* Desktop Nav */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            {logoImage ? (
              <img src={logoImage} alt={logoText} className="h-8 w-auto rounded-md" />
            ) : (
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="font-display text-primary-foreground text-sm">S</span>
              </div>
            )}
            <div className="hidden sm:block">
              <span className="font-heading font-bold text-foreground">{logoText}</span>
              <span className="block text-[10px] label-caps text-muted-foreground -mt-1">{logoSubtitle}</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/254707209775"
              target="_blank"
              rel="noopener"
              className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </a>
            <button
              onClick={openCart}
              className="relative p-2 rounded-md hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center"
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-md lg:hidden"
          >
            <div className="flex justify-end p-4">
              <button onClick={() => setMobileOpen(false)} className="p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col items-center gap-6 mt-12">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-heading text-2xl font-bold text-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-14">
          <Link to="/" className={`flex flex-col items-center gap-0.5 ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}>
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link to="/products" className={`flex flex-col items-center gap-0.5 ${pathname.startsWith("/products") ? "text-primary" : "text-muted-foreground"}`}>
            <Search className="w-5 h-5" />
            <span className="text-[10px]">Shop</span>
          </Link>
          <button onClick={openCart} className="flex flex-col items-center gap-0.5 text-muted-foreground relative">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
            <span className="text-[10px]">Cart</span>
          </button>
          <Link to={accountHref} className={`flex flex-col items-center gap-0.5 ${pathname === "/account" || pathname === "/login" ? "text-primary" : "text-muted-foreground"}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px]">{user ? "Account" : "Login"}</span>
          </Link>
        </div>
      </div>
    </>
  );
}