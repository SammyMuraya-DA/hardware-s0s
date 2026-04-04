import { Link } from "react-router-dom";
import { MapPin, Phone, MessageCircle, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[hsl(222,24%,5%)] border-t border-border mt-auto">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="font-display text-primary-foreground text-sm">S</span>
              </div>
              <div>
                <span className="font-heading font-bold text-foreground">SOS HARDWARE</span>
                <span className="block text-[10px] label-caps text-muted-foreground -mt-1">& GLASSMART</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Your trusted building partner in Nyeri, Kenya. Quality hardware, glass & fittings since 2005.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 glass-card hover:text-primary transition-colors text-muted-foreground">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://wa.me/254707209775" className="p-2 glass-card hover:text-primary transition-colors text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 glass-card hover:text-primary transition-colors text-muted-foreground">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Products", href: "/products" },
                { label: "Offers", href: "/offers" },
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-4">Categories</h4>
            <ul className="space-y-2">
              {[
                { label: "Door Locks", href: "/category/door-locks" },
                { label: "Glass & Glazing", href: "/category/glass" },
                { label: "Roofing", href: "/category/roofing" },
                { label: "Plumbing", href: "/category/plumbing" },
                { label: "Tools", href: "/category/tools" },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                Nyeri Town, Kirinyaga Road
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                0707 209 775
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4 flex-shrink-0 text-primary" />
                <a href="https://wa.me/254707209775" className="hover:text-primary transition-colors">
                  WhatsApp Steve
                </a>
              </li>
              <li className="text-sm text-muted-foreground">
                🕐 Mon–Sat: 7:30AM–6PM<br />
                &nbsp;&nbsp;&nbsp;&nbsp;Sun: 9AM–1PM
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground">
            © 2025 SOS Hardware & Glassmart. Developed By KONNEX INFOTECH SOLUTIONS 🇰🇪
          </p>
          <p className="text-xs text-muted-foreground">
            Payments secured by M-Pesa
          </p>
        </div>
      </div>
    </footer>
  );
}
