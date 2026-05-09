import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(2, 'Name is required').max(100),
});

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/';

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, from, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: fd.get('email'),
      password: fd.get('password'),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success('Welcome back!');
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      email: fd.get('email'),
      password: fd.get('password'),
      displayName: fd.get('displayName'),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.displayName);
    setBusy(false);
    if (error) {
      toast.error(error.includes('already registered') ? 'This email is already registered. Please sign in instead.' : error);
    } else {
      toast.success('Account created — check your email to verify.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In | SOS Hardware & Glassmart</title>
        <meta name="description" content="Sign in or create your SOS Hardware account to track orders, save favourites, and check out faster." />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-1 text-center">Welcome</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Sign in or create an account</p>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-6 w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div>
                  <Label htmlFor="si-password">Password</Label>
                  <Input id="si-password" name="password" type="password" autoComplete="current-password" required minLength={6} />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="su-name">Full Name</Label>
                  <Input id="su-name" name="displayName" type="text" autoComplete="name" required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div>
                  <Label htmlFor="su-password">Password (min 6 characters)</Label>
                  <Input id="su-password" name="password" type="password" autoComplete="new-password" required minLength={6} />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Continue shopping as guest? <Link to="/products" className="text-primary hover:underline">Browse products</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;