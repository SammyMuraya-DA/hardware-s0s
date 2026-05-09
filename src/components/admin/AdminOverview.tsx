import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatKSh } from '@/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { TrendingUp, ShoppingBag, Users, Package, AlertCircle, Loader2 } from 'lucide-react';

interface OrderRow { id: string; total: number; status: string; created_at: string; customer_name: string; phone: string; items: unknown }
interface ProductRow { id: string; name: string; category: string; stock: number; price: number; discount: number | null }

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdminOverview = () => {
  const { data: orders = [], isLoading: l1 } = useQuery<OrderRow[]>({
    queryKey: ['admin-overview-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id,total,status,created_at,customer_name,phone,items')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as OrderRow[];
    },
  });

  const { data: products = [], isLoading: l2 } = useQuery<ProductRow[]>({
    queryKey: ['admin-overview-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,category,stock,price,discount');
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  if (l1 || l2) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // KPIs
  const revenue = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const aov = orders.length ? revenue / orders.length : 0;
  const uniqueCustomers = new Set(orders.map((o) => o.phone)).size;
  const repeatCustomers = orders.length - uniqueCustomers;
  const lowStock = products.filter((p) => p.stock <= 5).length;

  // 30-day sales chart
  const days: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = startOfDay(subDays(new Date(), i));
    days.push({ date: format(d, 'MMM d'), revenue: 0, orders: 0 });
  }
  const dayIndex = new Map(days.map((d, i) => [d.date, i]));
  orders.forEach((o) => {
    const key = format(startOfDay(new Date(o.created_at)), 'MMM d');
    const idx = dayIndex.get(key);
    if (idx !== undefined) {
      days[idx].revenue += Number(o.total ?? 0);
      days[idx].orders += 1;
    }
  });

  // Sales by category (from order items snapshot)
  const catRevenue = new Map<string, number>();
  const productCat = new Map(products.map((p) => [p.id, p.category]));
  orders.forEach((o) => {
    if (Array.isArray(o.items)) {
      (o.items as Array<{ product_id: string; price: number; quantity: number }>).forEach((it) => {
        const cat = productCat.get(it.product_id) ?? 'Other';
        catRevenue.set(cat, (catRevenue.get(cat) ?? 0) + Number(it.price) * Number(it.quantity));
      });
    }
  });
  const catData = Array.from(catRevenue.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Top products
  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  orders.forEach((o) => {
    if (Array.isArray(o.items)) {
      (o.items as Array<{ product_id: string; name: string; price: number; quantity: number }>).forEach((it) => {
        const cur = productSales.get(it.product_id) ?? { name: it.name, qty: 0, revenue: 0 };
        cur.qty += Number(it.quantity);
        cur.revenue += Number(it.price) * Number(it.quantity);
        productSales.set(it.product_id, cur);
      });
    }
  });
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Discount/offer impact
  const discounted = products.filter((p) => (p.discount ?? 0) > 0);
  const discountedSold = orders.reduce((sum, o) => {
    if (!Array.isArray(o.items)) return sum;
    return sum + (o.items as Array<{ product_id: string; quantity: number }>).reduce((s, it) => {
      return s + (discounted.some((d) => d.id === it.product_id) ? Number(it.quantity) : 0);
    }, 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={TrendingUp} label="Revenue" value={formatKSh(revenue)} sub={`${orders.length} orders`} />
        <KpiCard icon={ShoppingBag} label="Avg Order Value" value={formatKSh(Math.round(aov))} />
        <KpiCard icon={Users} label="Customers" value={String(uniqueCustomers)} sub={`${repeatCustomers} repeat`} />
        <KpiCard icon={AlertCircle} label="Low Stock" value={String(lowStock)} sub="≤ 5 items" tone={lowStock > 0 ? 'warn' : 'ok'} />
      </div>

      {/* Sales chart */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-3">Last 30 Days — Revenue</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={days}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatKSh(v)} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by category */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3">Sales by Category</h3>
          {catData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sales yet</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatKSh(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3">Top Products by Revenue</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sales yet</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={(v: number) => formatKSh(v)} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Offer impact */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-3">Discount / Offer Performance</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Discounted Products</p>
            <p className="text-xl font-bold">{discounted.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Units Sold (discounted)</p>
            <p className="text-xl font-bold">{discountedSold}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Avg Discount</p>
            <p className="text-xl font-bold">
              {discounted.length
                ? `${Math.round(discounted.reduce((s, p) => s + (p.discount ?? 0), 0) / discounted.length)}%`
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'default',
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'warn' | 'ok';
}) => {
  const toneClass = tone === 'warn' ? 'text-destructive' : tone === 'ok' ? 'text-primary' : 'text-foreground';
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <p className={`text-xl font-bold ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
};

export default AdminOverview;