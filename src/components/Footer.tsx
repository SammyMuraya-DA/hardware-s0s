import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, Clock } from 'lucide-react';

const cols = [
  {
    title: 'Need Help?',
    links: [
      { to: '/contact', label: 'Contact Us' },
      { to: '/quote', label: 'Get a Quote' },
      { to: '/services', label: 'Our Services' },
      { to: '/contact', label: 'Help Center' },
    ],
  },
  {
    title: 'About SOS',
    links: [
      { to: '/services', label: 'About Us' },
      { to: '/products', label: 'All Products' },
      { to: '/services', label: 'Services' },
      { to: '/contact', label: 'Find a Store' },
    ],
  },
  {
    title: 'Make Money',
    links: [
      { to: '/contact', label: 'Sell on SOS' },
      { to: '/contact', label: 'Become a Vendor' },
      { to: '/quote', label: 'Bulk Orders' },
    ],
  },
];

const Footer = () => (
  <footer className="bg-steel text-steel-foreground mt-12">
    <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
      {cols.map(col => (
        <div key={col.title}>
          <h4 className="font-bold mb-3 text-sm">{col.title}</h4>
          <ul className="space-y-2 text-steel-foreground/80">
            {col.links.map(l => (
              <li key={l.label}>
                <Link to={l.to} className="hover:text-primary transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <h4 className="font-bold mb-3 text-sm">Payment & Delivery</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {['M-Pesa', 'Visa', 'Mastercard', 'COD'].map(p => (
            <span
              key={p}
              className="text-[10px] font-semibold px-2 py-1 bg-card text-foreground rounded"
            >
              {p}
            </span>
          ))}
        </div>
        <ul className="space-y-1.5 text-steel-foreground/80 text-xs">
          <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +254 701 207207</li>
          <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> glassmartkenya@gmail.com</li>
          <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Nairobi Rd, Ruring'u, Nyeri</li>
          <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Mon–Sat 8am–7pm</li>
        </ul>
      </div>
    </div>

    <div className="border-t border-steel-foreground/10">
      <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-steel-foreground/70">
        <p>© {new Date().getFullYear()} SOS Hardware & Glassmart · Glassmart Kenya Ltd</p>
        <div className="flex items-center gap-3">
          <a href="#" aria-label="Facebook" className="hover:text-primary"><Facebook className="w-4 h-4" /></a>
          <a href="#" aria-label="Instagram" className="hover:text-primary"><Instagram className="w-4 h-4" /></a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
