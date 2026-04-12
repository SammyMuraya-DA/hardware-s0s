import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DollarSign, ShoppingCart, AlertTriangle, Package, ArrowUpRight, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/hooks/useProducts";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

interface KPI { label: string; value: string; sub: string; icon: React.ElementType; color: string; gradient: string }

export default function AdminOverview() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

      const [ordersRes, productsRes, lowStockRes, todayOrdersRes, allOrdersRes, topItemsRes] = await Promise.all([
        supabase.from("orders_summary").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("products").select("id", { count: "exact" }).eq("is_active", true),
        supabase.from("products").select("id", { count: "exact" }).lte("stock_quantity", 5).eq("is_active", true),
        supabase.from("orders").select("total_amount, status").gte("created_at", today + "T00:00:00"),
        supabase.from("orders").select("total_amount, status, created_at").gte("created_at", thirtyDaysAgo + "T00:00:00"),
        supabase.from("order_items").select("product_name, quantity, total_price").order("quantity", { ascending: false }).limit(100),
      ]);

      const todayRevenue = (todayOrdersRes.data || []).reduce((s, o) => s + Number(o.total_amount), 0);
      const todayCount = todayOrdersRes.data?.length || 0;
      const pendingCount = (todayOrdersRes.data || []).filter(o => o.status === "pending").length;
      const monthRevenue = (allOrdersRes.data || []).reduce((s, o) => s + Number(o.total_amount), 0);

      setKpis([
        { label: "Today's Revenue", value: formatPrice(todayRevenue), sub: `${todayCount} orders`, icon: DollarSign, color: "text-primary", gradient: "from-primary/20 to-primary/5" },
        { label: "Monthly Revenue", value: formatPrice(monthRevenue), sub: `${allOrdersRes.data?.length || 0} orders`, icon: TrendingUp, color: "text-green-400", gradient: "from-green-500/20 to-green-500/5" },
        { label: "Low Stock Items", value: String(lowStockRes.count || 0), sub: "needs attention", icon: AlertTriangle, color: "text-warning", gradient: "from-warning/20 to-warning/5" },
        { label: "Active Products", value: String(productsRes.count || 0), sub: "listed in store", icon: Package, color: "text-blue-400", gradient: "from-blue-500/20 to-blue-500/5" },
      ]);

      setRecentOrders(ordersRes.data || []);

      // Chart: last 7 days from all orders
      const days: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        const dayOrders = (allOrdersRes.data || []).filter(o => o.created_at?.startsWith(ds));
        days.push({
          day: d.toLocaleDateString("en", { weekday: "short" }),
          revenue: dayOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0),
          orders: dayOrders.length,
        });
      }
      setChartData(days);

      // Status pie
      const statuses = ["pending", "confirmed", "delivered", "cancelled"];
      const allOrdSum = ordersRes.data || [];
      setStatusData(statuses.map(s => ({ name: s, value: allOrdSum.filter((o: any) => o.status === s).length })).filter(s => s.value > 0));

      // Top selling products
      const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
      (topItemsRes.data || []).forEach((item: any) => {
        if (!productMap[item.product_name]) productMap[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 };
        productMap[item.product_name].qty += item.quantity;
        productMap[item.product_name].revenue += Number(item.total_price);
      });
      const sorted = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 8);
      setTopProducts(sorted);

      setLoading(false);
    };
    load();
  }, []);

  const STATUS_COLORS = ["hsl(var(--primary))", "#2ECC71", "#3B82F6", "#E5383B"];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card p-5 border border-border/50 bg-gradient-to-br ${kpi.gradient} hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">{kpi.label}</p>
                <p className={`text-2xl font-heading font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass-card p-5 border border-border/50">
          <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Revenue (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface-2))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5 border border-border/50">
          <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" /> Orders by Status
          </h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2">
                {statusData.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No orders yet</div>
          )}
        </motion.div>
      </div>

      {/* Top Selling Products */}
      {topProducts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5 border border-border/50">
          <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" /> Best Selling Products
          </h3>
          <div className="grid lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProducts.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-primary/20 text-primary" : "bg-surface-2 text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground truncate max-w-[180px]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">{p.qty} sold</span>
                    <span className="block text-xs font-mono text-primary">{formatPrice(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Orders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" /> Recent Orders
          </h3>
          <Link to="/admin/orders" className="text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowUpRight className="w-3 h-3" /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 text-muted-foreground font-medium text-xs">Order #</th>
                <th className="text-left py-2.5 text-muted-foreground font-medium text-xs">Customer</th>
                <th className="text-left py-2.5 text-muted-foreground font-medium text-xs">Amount</th>
                <th className="text-left py-2.5 text-muted-foreground font-medium text-xs">Payment</th>
                <th className="text-left py-2.5 text-muted-foreground font-medium text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o: any) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                  <td className="py-3 font-mono text-xs text-foreground">{o.order_number}</td>
                  <td className="py-3 text-foreground">{o.customer_name}</td>
                  <td className="py-3 font-mono text-primary font-semibold">{formatPrice(Number(o.total_amount))}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.payment_status === "completed" ? "bg-green-500/10 text-green-400" : "bg-warning/10 text-warning"}`}>
                      {o.payment_status === "completed" ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      o.status === "delivered" ? "bg-green-500/10 text-green-400" :
                      o.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                      "bg-primary/10 text-primary"
                    }`}>{o.status}</span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
