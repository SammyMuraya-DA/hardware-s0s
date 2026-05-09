import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const AccountSettings = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [busy, setBusy] = useState<'email' | 'pwd' | null>(null);

  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || email === user?.email) { toast.error('Enter a new email'); return; }
    setBusy('email');
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_self_email', payload: { email } },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success('Email updated. You may need to sign in again.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setBusy(null); }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPwd) { toast.error('Passwords do not match'); return; }
    setBusy('pwd');
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_self_password', payload: { password } },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success('Password updated');
      setPassword(''); setConfirmPwd('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setBusy(null); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
      <form onSubmit={updateEmail} className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Change Email</h3>
        </div>
        <p className="text-xs text-muted-foreground">Email is updated immediately — no confirmation required.</p>
        <div>
          <Label>New Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" disabled={busy === 'email'} className="w-full">
          {busy === 'email' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Update Email
        </Button>
      </form>

      <form onSubmit={updatePassword} className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Change Password</h3>
        </div>
        <p className="text-xs text-muted-foreground">Choose a strong password (minimum 8 characters).</p>
        <div>
          <Label>New Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </div>
        <div>
          <Label>Confirm Password</Label>
          <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} minLength={8} required />
        </div>
        <Button type="submit" disabled={busy === 'pwd'} className="w-full">
          {busy === 'pwd' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Update Password
        </Button>
      </form>
    </div>
  );
};

export default AccountSettings;