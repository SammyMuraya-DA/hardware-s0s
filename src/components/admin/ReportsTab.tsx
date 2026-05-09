import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { downloadCSV } from '@/lib/csv';
import { Download, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { exportBrandedPDF, exportBrandedXLSX } from '@/lib/reports';
import SalesReports from './SalesReports';

const ReportsTab = () => {
  const { data: orders = [], isLoading: l1 } = useQuery({
    queryKey: ['report-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [], isLoading: l2 } = useQuery({
    queryKey: ['report-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: quotes = [], isLoading: l3 } = useQuery({
    queryKey: ['report-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('quote_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const ts = format(new Date(), 'yyyyMMdd-HHmm');

  const exportOrders = () => downloadCSV(`orders-${ts}.csv`, orders.map((o) => ({
    order_id: o.order_id, status: o.status, customer: o.customer_name, phone: o.phone,
    address: o.delivery_address, payment: o.payment_method, total: o.total,
    items_count: Array.isArray(o.items) ? o.items.length : 0,
    created_at: o.created_at,
  })));

  const exportProducts = () => downloadCSV(`products-${ts}.csv`, products.map((p) => ({
    name: p.name, slug: p.slug, category: p.category, brand: p.brand,
    price: p.price, original_price: p.original_price, discount: p.discount,
    stock: p.stock, rating: p.rating, reviews: p.review_count,
    is_express: p.is_express, is_genuine: p.is_genuine,
  })));

  const exportCustomers = () => {
    const map = new Map<string, { phone: string; name: string; orders: number; total: number; last_order: string }>();
    orders.forEach((o) => {
      const cur = map.get(o.phone) ?? { phone: o.phone, name: o.customer_name, orders: 0, total: 0, last_order: o.created_at };
      cur.orders += 1;
      cur.total += Number(o.total ?? 0);
      if (o.created_at > cur.last_order) cur.last_order = o.created_at;
      map.set(o.phone, cur);
    });
    downloadCSV(`customers-${ts}.csv`, Array.from(map.values()).sort((a, b) => b.total - a.total));
  };

  const exportQuotes = () => downloadCSV(`quotes-${ts}.csv`, quotes.map((q) => ({
    name: q.name, phone: q.phone, email: q.email, type: q.type, branch: q.branch,
    location: q.location, description: q.description, status: q.status, created_at: q.created_at,
  })));

  const ordersPdf = () => exportBrandedPDF({
    title: 'Orders Report',
    subtitle: `${orders.length} orders · generated ${format(new Date(), 'PPp')}`,
    filename: `orders-${ts}.pdf`,
    columns: ['Order ID', 'Customer', 'Phone', 'Status', 'Total (KSh)', 'Date'],
    rows: orders.map((o) => [o.order_id, o.customer_name, o.phone, o.status, Math.round(Number(o.total ?? 0)), format(new Date(o.created_at), 'yyyy-MM-dd')]),
    summary: [
      { label: 'Total orders', value: String(orders.length) },
      { label: 'Revenue', value: String(orders.reduce((s, o) => s + Number(o.total ?? 0), 0).toLocaleString()) },
    ],
  });
  const ordersXlsx = () => exportBrandedXLSX({
    title: 'Orders Report',
    subtitle: `${orders.length} orders`,
    filename: `orders-${ts}.xlsx`,
    columns: ['Order ID', 'Customer', 'Phone', 'Status', 'Total', 'Date'],
    rows: orders.map((o) => [o.order_id, o.customer_name, o.phone, o.status, Number(o.total ?? 0), format(new Date(o.created_at), 'yyyy-MM-dd')]),
  });
  const productsPdf = () => exportBrandedPDF({
    title: 'Products Catalog',
    filename: `products-${ts}.pdf`,
    columns: ['Name', 'Category', 'Brand', 'Price', 'Stock'],
    rows: products.map((p) => [p.name, p.category, p.brand ?? '', Number(p.price ?? 0), Number(p.stock ?? 0)]),
  });
  const productsXlsx = () => exportBrandedXLSX({
    title: 'Products Catalog',
    filename: `products-${ts}.xlsx`,
    columns: ['Name', 'Slug', 'Category', 'Brand', 'Price', 'Original Price', 'Stock', 'Discount'],
    rows: products.map((p) => [p.name, p.slug ?? '', p.category, p.brand ?? '', Number(p.price ?? 0), Number(p.original_price ?? 0), Number(p.stock ?? 0), Number(p.discount ?? 0)]),
  });

  const loading = l1 || l2 || l3;

  const cards = [
    { label: 'Orders Report', count: orders.length, csv: exportOrders, pdf: ordersPdf, xlsx: ordersXlsx, desc: 'All orders with customer, payment, and totals.' },
    { label: 'Products Catalog', count: products.length, csv: exportProducts, pdf: productsPdf, xlsx: productsXlsx, desc: 'Full catalog with stock, prices, and discounts.' },
    { label: 'Customers', count: new Set(orders.map((o) => o.phone)).size, csv: exportCustomers, desc: 'Aggregated buyers, lifetime value, repeat orders.' },
    { label: 'Quote Requests', count: quotes.length, csv: exportQuotes, desc: 'Service quote enquiries with contact details.' },
  ];

  return (
    <div className="space-y-4">
      <SalesReports />

      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-bold text-lg mb-1">Data Exports</h3>
        <p className="text-sm text-muted-foreground">Download datasets as CSV, branded PDF, or Excel.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-card border rounded-lg p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <FileText className="w-4 h-4" /> {c.label}
              </div>
              <p className="text-3xl font-bold">{c.count}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{c.desc}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={c.csv} variant="outline" size="sm" disabled={c.count === 0}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
                {c.pdf && (
                  <Button onClick={c.pdf} variant="outline" size="sm" disabled={c.count === 0}>
                    <FileText className="w-4 h-4 mr-1" /> PDF
                  </Button>
                )}
                {c.xlsx && (
                  <Button onClick={c.xlsx} variant="outline" size="sm" disabled={c.count === 0}>
                    <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsTab;