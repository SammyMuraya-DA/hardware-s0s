import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, FileSpreadsheet, Calendar } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { exportBrandedPDF, exportBrandedXLSX } from '@/lib/reports';
import { formatKSh } from '@/types';

type Period = 'daily' | 'weekly' | 'monthly';
type Range = '7' | '30' | '90' | '365';

const SalesReports = () => {
  const [period, setPeriod] = useState<Period>('daily');
  const [range, setRange] = useState<Range>('30');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales-report-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { from, to } = useMemo(() => {
    const end = new Date();
    const days = Number(range);
    return { from: subDays(startOfDay(end), days), to: endOfDay(end) };
  }, [range]);

  const filtered = useMemo(
    () => orders.filter((o) => {
      const t = new Date(o.created_at);
      return t >= from && t <= to && o.status !== 'Cancelled';
    }),
    [orders, from, to]
  );

  const buckets = useMemo(() => {
    let intervals: Date[] = [];
    let bucketKey: (d: Date) => string;
    let bucketLabel: (d: Date) => string;
    if (period === 'daily') {
      intervals = eachDayOfInterval({ start: from, end: to });
      bucketKey = (d) => format(startOfDay(d), 'yyyy-MM-dd');
      bucketLabel = (d) => format(d, 'MMM d, yyyy');
    } else if (period === 'weekly') {
      intervals = eachWeekOfInterval({ start: from, end: to });
      bucketKey = (d) => format(startOfWeek(d), 'yyyy-MM-dd');
      bucketLabel = (d) => `Week of ${format(d, 'MMM d, yyyy')}`;
    } else {
      intervals = eachMonthOfInterval({ start: from, end: to });
      bucketKey = (d) => format(startOfMonth(d), 'yyyy-MM');
      bucketLabel = (d) => format(d, 'MMMM yyyy');
    }

    const map = new Map<string, { label: string; orders: number; units: number; revenue: number }>();
    intervals.forEach((d) => map.set(bucketKey(d), { label: bucketLabel(d), orders: 0, units: 0, revenue: 0 }));
    filtered.forEach((o) => {
      const k = bucketKey(new Date(o.created_at));
      const b = map.get(k);
      if (!b) return;
      b.orders += 1;
      b.revenue += Number(o.total ?? 0);
      const items = Array.isArray(o.items) ? (o.items as Array<{ quantity?: number }>) : [];
      b.units += items.reduce((s, it) => s + Number(it.quantity ?? 0), 0);
    });
    return Array.from(map.values());
  }, [filtered, period, from, to]);

  const totals = useMemo(() => buckets.reduce(
    (acc, b) => ({ orders: acc.orders + b.orders, units: acc.units + b.units, revenue: acc.revenue + b.revenue }),
    { orders: 0, units: 0, revenue: 0 }
  ), [buckets]);

  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
  const subtitle = `${periodLabel} sales · ${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;

  const summary = [
    { label: 'Total orders', value: String(totals.orders) },
    { label: 'Units sold', value: String(totals.units) },
    { label: 'Revenue', value: formatKSh(totals.revenue) },
    { label: 'Avg order value', value: formatKSh(totals.orders ? totals.revenue / totals.orders : 0) },
  ];
  const columns = ['Period', 'Orders', 'Units', 'Revenue (KSh)'];
  const rows = buckets.map((b) => [b.label, b.orders, b.units, Math.round(b.revenue)]);

  const ts = format(new Date(), 'yyyyMMdd-HHmm');

  const downloadPdf = () => exportBrandedPDF({
    title: `Sales Report — ${periodLabel}`,
    subtitle,
    filename: `sales-${period}-${ts}.pdf`,
    columns, rows, summary,
  });

  const downloadXlsx = () => exportBrandedXLSX({
    title: `Sales Report — ${periodLabel}`,
    subtitle,
    filename: `sales-${period}-${ts}.xlsx`,
    columns, rows, summary,
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Sales Reports</h3>
        <p className="text-sm text-muted-foreground">Generate branded daily, weekly, or monthly sales reports as PDF or Excel.</p>
      </div>

      <div className="bg-card border rounded-lg p-4 grid sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-xs font-medium block mb-1">Group by</label>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Date range</label>
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadPdf} disabled={isLoading || rows.length === 0} className="flex-1">
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button onClick={downloadXlsx} variant="outline" disabled={isLoading || rows.length === 0} className="flex-1">
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {summary.map((s) => (
              <div key={s.label} className="bg-card border rounded-lg p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-sm">
                <thead className="bg-secondary sticky top-0">
                  <tr>
                    <th className="text-left p-3">Period</th>
                    <th className="text-right p-3">Orders</th>
                    <th className="text-right p-3">Units</th>
                    <th className="text-right p-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {buckets.map((b) => (
                    <tr key={b.label} className="border-t">
                      <td className="p-3">{b.label}</td>
                      <td className="p-3 text-right">{b.orders}</td>
                      <td className="p-3 text-right">{b.units}</td>
                      <td className="p-3 text-right font-medium">{formatKSh(b.revenue)}</td>
                    </tr>
                  ))}
                  {buckets.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No sales in this range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesReports;