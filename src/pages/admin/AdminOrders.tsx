import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/hooks/useProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Eye, MessageCircle, Truck, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const statuses = ["pending", "confirmed", "processing", "ready_for_pickup", "shipped", "delivered", "cancelled"];
const STEVE_WHATSAPP = "254707209775";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deliveryCostOrder, setDeliveryCostOrder] = useState<any>(null);
  const [deliveryCostValue, setDeliveryCostValue] = useState("");
  const [savingDelivery, setSavingDelivery] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    let q = supabase.from("orders_summary").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated", description: `Status → ${status}` });
    load();
  };

  const viewOrder = async (order: any) => {
    setDetailOrder(order);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems(data || []);
  };

  const buildWhatsAppMsg = (order: any, items: any[]) => {
    const isPaid = order.payment_status === "completed";
    let msg = `🛒 *ORDER: ${order.order_number}*\n━━━━━━━━━━━━━━━━━━\n`;
    msg += isPaid ? `✅ *PAID*` : `⏳ *NOT PAID (Pay Later)*`;
    if (order.mpesa_receipt) msg += `\n📝 Receipt: ${order.mpesa_receipt}`;
    msg += `\n\n👤 *Customer:* ${order.customer_name}\n📞 *Phone:* ${order.customer_phone}`;
    if (order.customer_email) msg += `\n📧 *Email:* ${order.customer_email}`;
    msg += `\n🚚 *Delivery:* ${order.delivery_type || "pickup"}`;
    msg += `\n📅 *Date:* ${new Date(order.created_at).toLocaleString()}\n`;
    if (items.length > 0) {
      msg += `\n📦 *Items:*\n`;
      items.forEach(i => {
        msg += `  • ${i.product_name} x${i.quantity}${i.unit ? ` (${i.unit})` : ""} — ${formatPrice(Number(i.total_price))}\n`;
      });
    }
    msg += `\n💰 Subtotal: ${formatPrice(Number(order.subtotal))}`;
    if (Number(order.delivery_fee) > 0) msg += `\n🚛 Delivery: ${formatPrice(Number(order.delivery_fee))}`;
    msg += `\n*💵 TOTAL: ${formatPrice(Number(order.total_amount))}*`;
    msg += `\n━━━━━━━━━━━━━━━━━━`;
    return msg;
  };

  const sendOrderToWhatsApp = async (order: any) => {
    // Fetch items if not already loaded
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    const msg = buildWhatsAppMsg(order, items || []);
    window.open(`https://wa.me/${STEVE_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendDetailToWhatsApp = () => {
    if (!detailOrder) return;
    const msg = buildWhatsAppMsg(detailOrder, orderItems);
    window.open(`https://wa.me/${STEVE_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("order_items").delete().eq("order_id", deleteId);
    await supabase.from("payments").delete().eq("order_id", deleteId);
    const { error } = await supabase.from("orders").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Deleted" }); load(); }
    setDeleteId(null);
  };

  const openDeliveryCost = (order: any) => {
    setDeliveryCostOrder(order);
    setDeliveryCostValue(String(order.delivery_fee || ""));
  };

  const saveDeliveryCost = async () => {
    if (!deliveryCostOrder) return;
    setSavingDelivery(true);
    const fee = Number(deliveryCostValue) || 0;
    const newTotal = Number(deliveryCostOrder.subtotal) + fee;
    const { error } = await supabase.from("orders").update({
      delivery_fee: fee,
      total_amount: newTotal,
    }).eq("id", deliveryCostOrder.id);
    setSavingDelivery(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Delivery cost updated", description: `Fee: ${formatPrice(fee)}, New total: ${formatPrice(newTotal)}` });
    setDeliveryCostOrder(null);
    load();
  };

  const statusColor = (s: string) => {
    if (s === "delivered") return "bg-green-500/10 text-green-400";
    if (s === "cancelled") return "bg-destructive/10 text-destructive";
    if (s === "confirmed" || s === "processing") return "bg-blue-500/10 text-blue-400";
    return "bg-primary/10 text-primary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-xl font-bold">Orders ({orders.length})</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
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
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Delivery</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Payment</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No orders found</td></tr>
              ) : orders.map((o, i) => (
                <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border/50 hover:bg-surface-2/30 transition-colors">
                  <td className="p-3 font-mono text-xs text-foreground font-semibold">{o.order_number}</td>
                  <td className="p-3 text-foreground">{o.customer_name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{o.customer_phone}</td>
                  <td className="p-3 font-mono text-primary font-bold">{formatPrice(Number(o.total_amount))}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{o.delivery_type || "pickup"}</span>
                      {Number(o.delivery_fee) > 0 && <span className="text-[10px] text-primary font-mono">({formatPrice(Number(o.delivery_fee))})</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.payment_status === "completed" ? "bg-green-500/10 text-green-400" : "bg-warning/10 text-warning"}`}>
                      {o.payment_status === "completed" ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(o.status)}`}>{o.status}</span></td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewOrder(o)} title="View"><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-green-400" onClick={() => sendOrderToWhatsApp(o)} title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400" onClick={() => openDeliveryCost(o)} title="Set Delivery Cost"><Truck className="w-3.5 h-3.5" /></Button>
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(o.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Order {detailOrder?.order_number}</DialogTitle></DialogHeader>
          {detailOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Customer:</span> <span className="text-foreground font-medium">{detailOrder.customer_name}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground font-mono">{detailOrder.customer_phone}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{detailOrder.customer_email || "—"}</span></div>
                <div><span className="text-muted-foreground">Delivery:</span> <span className="text-foreground">{detailOrder.delivery_type || "pickup"}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(detailOrder.status)}`}>{detailOrder.status}</span></div>
                <div>
                  <span className="text-muted-foreground">Payment:</span>{" "}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${detailOrder.payment_status === "completed" ? "bg-green-500/10 text-green-400" : "bg-warning/10 text-warning"}`}>
                    {detailOrder.payment_status === "completed" ? "Paid" : "Unpaid"}
                  </span>
                </div>
                <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{new Date(detailOrder.created_at).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">M-Pesa:</span> <span className="text-foreground font-mono">{detailOrder.mpesa_receipt || "—"}</span></div>
              </div>
              <div className="border-t border-border pt-3">
                <h4 className="font-heading font-bold mb-2">Items ({orderItems.length})</h4>
                <div className="space-y-2">
                  {orderItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        {item.product_image && <img src={item.product_image} alt="" className="w-8 h-8 rounded object-cover" />}
                        <div>
                          <span className="text-foreground">{item.product_name}</span>
                          <span className="text-muted-foreground text-xs ml-2">x{item.quantity}</span>
                          {item.unit && <span className="text-muted-foreground text-xs ml-1">({item.unit})</span>}
                        </div>
                      </div>
                      <span className="font-mono text-primary">{formatPrice(Number(item.total_price))}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{formatPrice(Number(detailOrder.subtotal))}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{formatPrice(Number(detailOrder.delivery_fee || 0))}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={() => openDeliveryCost(detailOrder)}>Edit</Button>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-foreground"><span>Total</span><span className="text-primary">{formatPrice(Number(detailOrder.total_amount))}</span></div>
              </div>
              <Button onClick={sendDetailToWhatsApp} variant="outline" className="w-full gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10">
                <MessageCircle className="w-4 h-4" /> Send to WhatsApp
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Set Delivery Cost Dialog */}
      <Dialog open={!!deliveryCostOrder} onOpenChange={() => setDeliveryCostOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Set Delivery Cost</DialogTitle></DialogHeader>
          {deliveryCostOrder && (
            <div className="space-y-4">
              <div className="glass-card p-3 border border-border/50 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Order:</span><span className="font-mono font-bold">{deliveryCostOrder.order_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer:</span><span>{deliveryCostOrder.customer_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span className="font-mono text-primary">{formatPrice(Number(deliveryCostOrder.subtotal))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery:</span><span>{deliveryCostOrder.delivery_type || "pickup"}</span></div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Delivery Fee (KES)</label>
                <Input type="number" value={deliveryCostValue} onChange={e => setDeliveryCostValue(e.target.value)} placeholder="0" />
                {deliveryCostValue && (
                  <p className="text-xs text-primary mt-1">New total: {formatPrice(Number(deliveryCostOrder.subtotal) + Number(deliveryCostValue))}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeliveryCostOrder(null)}>Cancel</Button>
                <Button onClick={saveDeliveryCost} disabled={savingDelivery}>{savingDelivery ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Order?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the order, its items, and payments.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
