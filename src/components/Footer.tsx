import { Link } from "react-router-dom";
import { MapPin, Phone, MessageCircle, Instagram, Facebook, ArrowRight } from "lucide-react";

const quickLinks = [
  { label: "Products", href: "/products" },
  { label: "Offers", href: "/offers" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

const categoryLinks = [
  { label: "Door Locks", href: "/category/door-locks" },
  { label: "Glass & Glazing", href: "/category/glass" },
  { label: "Roofing", href: "/category/roofing" },
  { label: "Plumbing", href: "/category/plumbing" },
  { label: "Tools", href: "/category/tools" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-[hsl(222,24%,5%)]">
      <div className="container py-14 sm:py-16">
        <div className="mb-10 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-sm lg:grid-cols-[1.3fr_0.8fr] lg:items-center lg:p-8">
          <div className="space-y-3">
            <p className="text-xs label-caps text-primary">Built for homes, sites & contractors</p>
            <h3 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Need materials or fittings fast?
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Talk to our team for hardware supplies, glass solutions, pricing guidance, and quick order support in Nyeri.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <a
              href="https://wa.me/254707209775"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              WhatsApp Us
            </a>
            <a
              href="tel:+254707209775"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
            >
              Call 0707 209 775
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-sm">
                <span className="font-display text-sm text-primary-foreground">S</span>
              </div>
              <div>
                <span className="font-heading font-bold text-foreground">SOS HARDWARE</span>
                <span className="block -mt-1 text-[10px] label-caps text-muted-foreground">& GLASSMART</span>
              </div>
            </div>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Your trusted building partner in Nyeri, Kenya. Quality hardware, glass, and fittings backed by reliable local service.
            </p>
            <div className="flex gap-3">
              <a
                href="https://wa.me/254707209775"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with SOS Hardware on WhatsApp"
                className="glass-card p-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/254707209775"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with SOS Hardware on WhatsApp"
                className="glass-card p-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="tel:+254707209775"
                aria-label="Call SOS Hardware"
                className="glass-card p-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-heading font-bold text-foreground">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
                    <ArrowRight className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading font-bold text-foreground">Categories</h4>
            <ul className="space-y-2.5">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
                    <ArrowRight className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading font-bold text-foreground">Contact</h4>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Nyeri Ruringu, Off Parliament Road </span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="tel:+254707209775" className="transition-colors hover:text-primary">
                  0707 209 775
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                <a
                  href="https://wa.me/254707209775"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  WhatsApp Sos
                </a>
              </li>
              <li className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Opening hours</span>
                <br />
                Mon–Sat: 7:30AM–6PM
                <br />
                Sun: 9AM–3PM
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground">© 2026 SOS Hardware & Glassmart. Developed by Konnex Infotech Solution 🇰🇪</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-end">
            <span>Payments secured by M-Pesa</span>
            <Link to="/contact" className="transition-colors hover:text-primary">
              Request a quote
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}