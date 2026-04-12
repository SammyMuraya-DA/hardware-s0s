import { ShoppingCart, Phone, Menu, Search, X, Home, User, Tag, Wrench, Info, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteContent } from "@/hooks/useProducts";

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Offers", href: "/offers" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const mobileShortcutLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Products", href: "/products", icon: Search },
  { label: "Offers", href: "/offers", icon: Tag },
  { label: "Services", href: "/services", icon: Wrench },
  { label: "About", href: "/about", icon: Info },
  { label: "Contact", href: "/contact", icon: MessageSquare },
];

export function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountHref = user ? "/account" : "/login";
  const { data: siteContent = {} } = useSiteContent();

  const logoText = siteContent["logo_text"]?.value || "SOS HARDWARE";
  const logoSubtitle = siteContent["logo_subtitle"]?.value || "NYERI";
  const logoImage = siteContent["logo_text"]?.image_url;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="group flex items-center gap-3">
            {logoImage ? (
              <img src={logoImage} alt={logoText} className="h-9 w-auto rounded-md object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm transition-transform duration-200 group-hover:scale-105">
                <span className="font-display text-sm text-primary-foreground">S</span>
              </div>
            )}
            <div className="hidden sm:block">
              <span className="font-heading text-sm font-bold tracking-wide text-foreground">{logoText}</span>
              <span className="block -mt-0.5 text-[10px] label-caps text-muted-foreground">{logoSubtitle}</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active = isActiveLink(link.href);

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="tel:+254707209775"
              className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:flex"
            >
              <Phone className="h-4 w-4 text-primary" />
              Call Us
            </a>

            <a
              href="https://wa.me/254707209775"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 md:inline-flex"
            >
              WhatsApp
            </a>

            <button
              onClick={openCart}
              aria-label="Open cart"
              className="relative rounded-full p-2.5 transition-colors hover:bg-muted"
            >
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                >
                  {itemCount}
                </motion.span>
              )}
            </button>

            <Link
              to={accountHref}
              className={`hidden rounded-full px-3 py-2 text-sm font-medium transition-colors sm:inline-flex ${
                pathname === "/account" || pathname === "/login"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {user ? "Account" : "Login"}
            </Link>

            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-full p-2.5 transition-colors hover:bg-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm lg:hidden"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm border-l border-border bg-background lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <p className="font-heading text-sm font-bold text-foreground">{logoText}</p>
                  <p className="text-xs text-muted-foreground">Browse products, offers and support</p>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full p-2 transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex h-[calc(100%-73px)] flex-col justify-between overflow-y-auto px-5 py-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {mobileShortcutLinks.map((link) => {
                      const Icon = link.icon;
                      const active = isActiveLink(link.href);

                      return (
                        <Link
                          key={link.href}
                          to={link.href}
                          className={`rounded-2xl border p-4 transition-all ${
                            active
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="mb-3 h-5 w-5" />
                          <span className="block text-sm font-semibold">{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    {navLinks.map((link) => {
                      const active = isActiveLink(link.href);

                      return (
                        <Link
                          key={link.href}
                          to={link.href}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}

                    <Link
                      to={accountHref}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        pathname === "/account" || pathname === "/login"
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {user ? "My Account" : "Login"}
                    </Link>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-6">
                  <a
                    href="https://wa.me/254707209775"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                  >
                    Chat on WhatsApp
                  </a>
                  <a
                    href="tel:+254707209775"
                    className="flex items-center justify-center rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Call 0707 209 775
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-around">
          <Link to="/" className={`flex flex-col items-center gap-0.5 ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}>
            <Home className="h-5 w-5" />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link to="/products" className={`flex flex-col items-center gap-0.5 ${pathname.startsWith("/products") ? "text-primary" : "text-muted-foreground"}`}>
            <Search className="h-5 w-5" />
            <span className="text-[10px]">Shop</span>
          </Link>
          <button onClick={openCart} className="relative flex flex-col items-center gap-0.5 text-muted-foreground">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute right-1 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
            <span className="text-[10px]">Cart</span>
          </button>
          <Link
            to={accountHref}
            className={`flex flex-col items-center gap-0.5 ${pathname === "/account" || pathname === "/login" ? "text-primary" : "text-muted-foreground"}`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px]">{user ? "Account" : "Login"}</span>
          </Link>
        </div>
      </div>
    </>
  );
}