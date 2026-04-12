import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/hooks/useProducts";
import { User, Package, MapPin, Phone, Mail, Edit2, Save, LogOut, ChevronDown, ChevronUp, QrCode, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

const TILL_NUMBER = "TILL: 123456"; // Replace with actual till number

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-warning", label: "Pending" },
  confirmed: { icon: CheckCircle2, color: "text-blue-400", label: "Confirmed" },
  processing: { icon: Package, color: "text-primary", label: "Processing" },
  dispatched: { icon: Truck, color: "text-purple-400", label: "Dispatched" },
  delivered: { icon: CheckCircle2, color: "text-green-400", label: "Delivered" },
  cancelled: { icon: XCircle, color: "text-destructive", label: "Cancelled" },
};

export default function Account() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<"orders" | "profile">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ full_name: string; phone: string; town: string }>({ full_name: "", phone: "", town: "" });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;
    const [ordersRes, profileRes] = await Promise.all([
      supabase.from("orders").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    setOrders(ordersRes.data || []);
    if (profileRes.data) {
      setProfile({ full_name: profileRes.data.full_name || "", phone: profileRes.data.phone || "", town: profileRes.data.town || "" });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      phone: profile.phone,
      town: profile.town,
    }).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEditing(false);
      toast({ title: "Profile updated!" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const buildPaymentQRData = (order: any) => {
    // QR contains till number + order number + amount for scanning
    return `PAY TO TILL: ${TILL_NUMBER}\nOrder: ${order.order_number}\nAmount: KES ${order.total_amount}\nPhone: 0707209775`;
  };

  return (
    <div className="min-h-screen py-8 pb-24 lg:pb-8">
      <div className="container max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <User className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">{profile.full_name || "My Account"}</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-2 rounded-xl p-1">
          <button onClick={() => setTab("orders")} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-heading font-semibold transition-all ${tab === "orders" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}>
            <Package className="w-4 h-4 inline mr-1.5" /> My Orders
          </button>
          <button onClick={() => setTab("profile")} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-heading font-semibold transition-all ${tab === "profile" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}>
            <User className="w-4 h-4 inline mr-1.5" /> Profile
          </button>
        </div>

        {/* Orders Tab */}
        {tab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Package className="w-16 h-16 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No orders yet</p>
                <Button onClick={() => navigate("/products")}>Start Shopping</Button>
              </div>
            ) : orders.map(order => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isExpanded = expandedOrder === order.id;
              const isPayLater = order.is_pay_later && order.status !== "delivered" && order.status !== "cancelled";

              return (
                <motion.div key={order.id} layout className="glass-card border border-border/50 overflow-hidden">
                  <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="w-full p-4 flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center`}>
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-foreground">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-primary">{formatPrice(Number(order.total_amount))}</p>
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t border-border/50 p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Delivery:</span> <span className="text-foreground capitalize">{order.delivery_type}</span></div>
                        <div><span className="text-muted-foreground">Subtotal:</span> <span className="text-foreground">{formatPrice(Number(order.subtotal))}</span></div>
                        {Number(order.delivery_fee) > 0 && <div><span className="text-muted-foreground">Delivery Fee:</span> <span className="text-foreground">{formatPrice(Number(order.delivery_fee))}</span></div>}
                        <div><span className="text-muted-foreground">Payment:</span> <span className={order.is_pay_later ? "text-warning font-semibold" : "text-green-400 font-semibold"}>{order.is_pay_later ? "Pay Later" : "M-Pesa"}</span></div>
                      </div>

                      {/* QR Code for Pay Later orders */}
                      {isPayLater && (
                        <div className="bg-surface-2 rounded-xl p-5 text-center space-y-3 border border-primary/20">
                          <div className="flex items-center justify-center gap-2 text-primary font-heading font-bold text-sm">
                            <QrCode className="w-4 h-4" /> Scan to Pay
                          </div>
                          <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                            <QRCodeSVG value={buildPaymentQRData(order)} size={160} level="H" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Till Number</p>
                            <p className="font-mono text-lg font-bold text-primary">{TILL_NUMBER}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Scan this QR code or use the Till Number above to pay via M-Pesa</p>
                          <p className="font-mono text-sm font-bold text-foreground">Amount: {formatPrice(Number(order.total_amount))}</p>
                        </div>
                      )}

                      {/* Delivery tracking */}
                      <div className="space-y-2">
                        <p className="text-xs font-heading font-semibold text-muted-foreground">DELIVERY TRACKING</p>
                        <div className="flex items-center gap-2">
                          {["pending", "confirmed", "processing", "dispatched", "delivered"].map((s, i, arr) => {
                            const stIdx = arr.indexOf(order.status);
                            const done = i <= stIdx;
                            return (
                              <div key={s} className="flex items-center gap-1 flex-1">
                                <div className={`w-3 h-3 rounded-full ${done ? "bg-primary" : "bg-border"}`} />
                                {i < arr.length - 1 && <div className={`flex-1 h-0.5 ${done && i < stIdx ? "bg-primary" : "bg-border"}`} />}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Placed</span><span>Confirmed</span><span>Processing</span><span>Dispatched</span><span>Delivered</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Profile Tab */}
        {tab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 border border-border/50 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg text-foreground">Profile Details</h2>
              {!editing && <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Edit2 className="w-4 h-4 mr-1" /> Edit</Button>}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Full Name</label>
                {editing ? <Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="mt-1" /> : <p className="text-foreground font-medium mt-1">{profile.full_name || "—"}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                <p className="text-foreground font-medium mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                {editing ? <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="mt-1" placeholder="0712345678" /> : <p className="text-foreground font-medium mt-1">{profile.phone || "—"}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Town</label>
                {editing ? <Input value={profile.town} onChange={e => setProfile({ ...profile, town: e.target.value })} className="mt-1" placeholder="Nyeri" /> : <p className="text-foreground font-medium mt-1">{profile.town || "—"}</p>}
              </div>
            </div>
            {editing && (
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                  {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
