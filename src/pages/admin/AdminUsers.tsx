import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Shield, ShieldCheck, UserPlus, Trash2, CheckCircle, XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "customer";
  created_at: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    // Get all profiles with their roles
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    if (!profiles) { setLoading(false); return; }

    const roleMap: Record<string, string> = {};
    (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });

    // We can't access auth.users directly, so we use profiles + roles
    const userList: UserRow[] = profiles.map(p => ({
      id: p.id,
      email: "", // Will be filled if we can get it
      full_name: p.full_name || "Unknown",
      role: (roleMap[p.id] as "admin" | "customer") || "customer",
      created_at: p.created_at,
    }));

    setUsers(userList);
    setLoading(false);
  };

  const promoteToAdmin = async () => {
    if (!promoteEmail.trim()) return;
    setPromoting(true);

    try {
      // Use edge function to find user by email and promote
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
    } finally {
      setPromoting(false);
    }
  };

  const removeAdmin = async (userId: string, name: string) => {
    if (userId === user?.id) {
      toast({ title: "Cannot remove yourself", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("manage-admin", {
        body: { action: "demote", target_user_id: userId, promoter_id: user?.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Admin removed", description: `${name} is now a regular customer.` });
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
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
      </div>

      {/* Promote to Admin */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border border-primary/20 space-y-4">
        <h3 className="font-heading font-bold text-sm flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Add New Admin
        </h3>
        <p className="text-xs text-muted-foreground">Enter the email of a registered user to promote them to admin. No email confirmation needed — instant approval.</p>
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
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                  <p className="text-xs text-muted-foreground">{a.id === user?.id ? "You (Super Admin)" : "Admin"}</p>
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
              <Button variant="ghost" size="sm" onClick={() => { setPromoteEmail(""); /* would need email */ toast({ title: "Use the email field above to promote this user" }); }}>
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Make Admin
              </Button>
            </div>
          ))}
          {customers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No customers found</p>}
        </div>
      </motion.div>
    </div>
  );
}
