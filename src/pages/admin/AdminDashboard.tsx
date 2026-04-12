import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, AlertTriangle, CreditCard, LogOut, Menu, X, Layers, Users, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const adminLinks = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Categories", href: "/admin/categories", icon: Layers },
  { label: "Inventory", href: "/admin/inventory", icon: AlertTriangle },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Site Content", href: "/admin/site-content", icon: Globe },
];

export default function AdminDashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [user, loading, navigate]);

  if (loading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link to="/admin" className="font-heading font-bold text-foreground">
            <span className="text-primary">SOS</span> Admin
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1"><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {adminLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                (link.href === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(link.href))
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2 px-3 truncate">{user?.email}</div>
          <button onClick={() => { signOut(); navigate("/"); }} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive w-full rounded-lg hover:bg-surface-2 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border h-14 flex items-center px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 mr-3"><Menu className="w-5 h-5" /></button>
          <h1 className="font-heading font-bold text-foreground">Admin Dashboard</h1>
          <Link to="/" className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">← Back to Store</Link>
        </header>
        <main className="flex-1 p-4 lg:p-6 pb-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
