import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, ShieldCheck, ShieldOff, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

const callAdmin = async (action: string, payload?: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

const UsersManager = () => {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', display_name: '' });
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ users: AdminUser[] }>({
    queryKey: ['admin-users-list'],
    queryFn: () => callAdmin('list_users'),
  });

  const users = data?.users ?? [];

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || form.password.length < 8) {
      toast.error('Email and password (8+ chars) required'); return;
    }
    setBusy('create');
    try {
      await callAdmin('create_user', form);
      toast.success('User created');
      setForm({ email: '', password: '', display_name: '' });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-users-list'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setBusy(null); }
  };

  const toggleAdmin = async (u: AdminUser) => {
    const isAdmin = u.roles.includes('admin');
    if (!confirm(isAdmin ? `Remove admin from ${u.email}?` : `Make ${u.email} an admin?`)) return;
    setBusy(u.id);
    try {
      await callAdmin('set_admin', { user_id: u.id, make_admin: !isAdmin });
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['admin-users-list'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setBusy(null); }
  };

  const remove = async (u: AdminUser) => {
    if (!confirm(`Permanently delete ${u.email}?`)) return;
    setBusy(u.id);
    try {
      await callAdmin('delete_user', { user_id: u.id });
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['admin-users-list'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">{users.length} Users</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-1" /> Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <Label>Password * (min 8 chars)</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
              </div>
              <div>
                <Label>Display name</Label>
                <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              </div>
              <Button type="submit" disabled={busy === 'create'} className="w-full">
                {busy === 'create' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-1" />}
                Create
              </Button>
              <p className="text-xs text-muted-foreground">User is created with email auto-confirmed. After creation, you can elevate them to admin from the table.</p>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Roles</th>
                  <th className="text-left p-3">Last Sign In</th>
                  <th className="text-left p-3">Joined</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = u.id === me?.id;
                  const isAdmin = u.roles.includes('admin');
                  return (
                    <tr key={u.id} className="border-t hover:bg-secondary/30">
                      <td className="p-3 font-medium">
                        {u.email}
                        {isMe && <span className="ml-2 text-[10px] text-muted-foreground">(you)</span>}
                      </td>
                      <td className="p-3">
                        {isAdmin
                          ? <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">admin</span>
                          : <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">customer</span>}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-3 flex gap-1 justify-end">
                        <button
                          onClick={() => toggleAdmin(u)}
                          disabled={busy === u.id || isMe}
                          title={isAdmin ? 'Revoke admin' : 'Make admin'}
                          className="p-1.5 rounded hover:bg-secondary disabled:opacity-30"
                        >
                          {isAdmin ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-primary" />}
                        </button>
                        <button
                          onClick={() => remove(u)}
                          disabled={busy === u.id || isMe}
                          className="p-1.5 rounded hover:bg-destructive/10 text-destructive disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;