import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/hooks/useProducts";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, failed: 0, revenue: 0 });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("payments_summary").select("*").order("created_at", { ascending: false }).limit(100);
      const payments = data || [];
      setPayments(payments);
      setStats({
        total: payments.length,
        completed: payments.filter(p => p.status === "completed").length,
        pending: payments.filter(p => p.status === "pending").length,
        failed: payments.filter(p => p.status === "failed" || p.status === "cancelled").length,
        revenue: payments.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0),
      });
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold">Payments</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatPrice(stats.revenue), icon: CreditCard, color: "text-primary", bg: "from-primary/20 to-primary/5" },
          { label: "Completed", value: String(stats.completed), icon: CheckCircle, color: "text-green-400", bg: "from-green-500/20 to-green-500/5" },
          { label: "Pending", value: String(stats.pending), icon: Clock, color: "text-warning", bg: "from-warning/20 to-warning/5" },
          { label: "Failed", value: String(stats.failed), icon: XCircle, color: "text-destructive", bg: "from-destructive/20 to-destructive/5" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`glass-card p-4 border border-border/50 bg-gradient-to-br ${s.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-heading font-bold ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Order #</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Customer</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Phone</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Amount</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Receipt</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No payments yet</td></tr>
              ) : payments.map((p: any, i: number) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-surface-2/30 transition-colors">
                  <td className="p-3 font-mono text-xs font-semibold">{p.order_number}</td>
                  <td className="p-3 text-foreground">{p.customer_name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{p.customer_phone}</td>
                  <td className="p-3 font-mono text-primary font-bold">{formatPrice(Number(p.amount))}</td>
                  <td className="p-3 font-mono text-xs text-foreground">{p.mpesa_receipt_number || "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === "completed" ? "bg-green-500/10 text-green-400" :
                      p.status === "failed" || p.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                      "bg-warning/10 text-warning"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
