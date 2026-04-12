import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Shield, ShieldCheck, ShieldAlert, UserPlus, Trash2, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "customer";
  created_at: string;
  is_pending_admin?: boolean;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [pendingAdmins, setPendingAdmins] = useState<any[]>([]);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    // admin_requests table - use type assertion since types may not be updated yet
    const { data: pending } = await (supabase as any).from("admin_requests").select("*").eq("status", "pending");

    if (!profiles) { setLoading(false); return; }

    const roleMap: Record<string, string> = {};
    (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });

    const userList: UserRow[] = profiles.map(p => ({
      id: p.id,
      email: "",
      full_name: p.full_name || "Unknown",
      role: (roleMap[p.id] as "admin" | "customer") || "customer",
      created_at: p.created_at,
    }));

    setUsers(userList);
    setPendingAdmins(pending || []);
    setLoading(false);
  };

  const promoteToAdmin = async () => {
    if (!promoteEmail.trim()) return;
    setPromoting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-admin", {
        body: { action: "promote", email: promoteEmail.trim(), promoter_id: user?.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Admin added!", description: `${promoteEmail} is now an admin.` });
      setPromoteEmail("");
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setPromoting(false); }
  };

  const removeAdmin = async (userId: string, name: string) => {
    if (userId === user?.id) { toast({ title: "Cannot remove yourself", variant: "destructive" }); return; }
    try {
      const { data, error } = await supabase.functions.invoke("manage-admin", {
        body: { action: "demote", target_user_id: userId, promoter_id: user?.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Admin removed", description: `${name} is now a customer.` });
      loadUsers();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const approveAdmin = async (requestId: string, requestUserId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-admin", {
        body: { action: "approve_request", request_id: requestId, target_user_id: requestUserId, promoter_id: user?.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Admin approved!" });
      loadUsers();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const rejectAdmin = async (requestId: string) => {
    try {
      const { error } = await (supabase as any).from("admin_requests").update({ status: "rejected" }).eq("id", requestId);
      if (error) throw error;
      toast({ title: "Request rejected" });
      loadUsers();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const admins = users.filter(u => u.role === "admin");
  const customers = users.filter(u => u.role === "customer" && u.full_name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> User Management
        </h2>
        <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">You are Super Admin</span>
      </div>

      {/* Pending Admin Requests */}
      {pendingAdmins.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border border-warning/30 space-y-4">
          <h3 className="font-heading font-bold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" /> Pending Admin Requests ({pendingAdmins.length})
          </h3>
          <div className="space-y-2">
            {pendingAdmins.map(req => (
              <div key={req.id} className="flex items-center justify-between py-3 px-3 rounded-lg bg-warning/5 border border-warning/20">
                <div>
                  <p className="text-sm font-medium text-foreground">{req.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{req.email} • Applied {new Date(req.created_at).toLocaleDateString()}</p>
                  {req.reason && <p className="text-xs text-muted-foreground mt-1 italic">"{req.reason}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => approveAdmin(req.id, req.user_id)} className="gap-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rejectAdmin(req.id)} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Promote to Admin */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border border-primary/20 space-y-4">
        <h3 className="font-heading font-bold text-sm flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Add New Admin (Direct)
        </h3>
        <p className="text-xs text-muted-foreground">Enter the email of a registered user to promote them to admin instantly. No email confirmation needed.</p>
        <div className="flex gap-3">
          <Input value={promoteEmail} onChange={e => setPromoteEmail(e.target.value)} placeholder="user@example.com" className="flex-1" />
          <Button onClick={promoteToAdmin} disabled={promoting || !promoteEmail.trim()}>
            {promoting ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><ShieldCheck className="w-4 h-4 mr-1" /> Promote</>}
          </Button>
        </div>
      </motion.div>

      {/* Current Admins */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 border border-border/50">
        <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400" /> Current Admins ({admins.length})
        </h3>
        <div className="space-y-2">
          {admins.map(a => (
            <div key={a.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-surface-2/50 transition-colors border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  {a.id === user?.id ? <ShieldAlert className="w-4 h-4 text-primary" /> : <ShieldCheck className="w-4 h-4 text-green-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                  <p className="text-xs text-muted-foreground">{a.id === user?.id ? "👑 Super Admin (You)" : "Admin"}</p>
                </div>
              </div>
              {a.id !== user?.id && (
                <Button variant="ghost" size="sm" onClick={() => removeAdmin(a.id, a.full_name)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {admins.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No admins found</p>}
        </div>
      </motion.div>

      {/* Customers */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-sm">Customers ({customers.length})</h3>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 h-8 text-xs" />
          </div>
        </div>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {customers.slice(0, 50).map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-2/50 transition-colors">
              <div>
                <p className="text-sm text-foreground">{c.full_name}</p>
                <p className="text-xs text-muted-foreground">Joined {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {customers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No customers found</p>}
        </div>
      </motion.div>
    </div>
  );
}
