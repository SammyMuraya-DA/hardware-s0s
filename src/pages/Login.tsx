import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, UserPlus, Mail, Lock, User, Shield } from "lucide-react";

const Login = () => {
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdminRequest, setIsAdminRequest] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    const checkAndRedirect = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      navigate(data ? "/admin" : "/");
    };
    checkAndRedirect();
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp || isAdminRequest) {
        await signUp(email, password, fullName);
        
        if (isAdminRequest) {
          // After signup, create an admin request (will be processed once email confirmed and user logs in)
          toast({ title: "Account created!", description: "Your admin request has been submitted. A super admin will review it. Check your email to verify your account." });
        } else {
          toast({ title: "Account created!", description: "Check your email to verify." });
        }
      } else {
        await signIn(email, password);
        
        // After login, if there's a pending admin request flag, submit the request
        toast({ title: "Welcome back!" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Submit admin request after successful signup & auth
  useEffect(() => {
    if (!user || !isAdminRequest) return;
    const submitRequest = async () => {
      try {
        await (supabase as any).from("admin_requests").insert({
          user_id: user.id,
          email: user.email,
          full_name: fullName || user.user_metadata?.full_name || "",
          reason: adminReason,
          status: "pending",
        });
      } catch (err) {
        console.error("Failed to submit admin request:", err);
      }
    };
    submitRequest();
  }, [user, isAdminRequest]);

  if (authLoading) return null;
  if (user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-20 lg:pb-0">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-amber-dark flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
            <span className="font-display text-primary-foreground text-2xl">S</span>
          </motion.div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {isAdminRequest ? "Admin Signup" : isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isAdminRequest ? "Request admin access — requires super admin approval" : isSignUp ? "Join SOS Hardware & Glassmart" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5 border border-border/50">
          {(isSignUp || isAdminRequest) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <label className="label-caps text-muted-foreground block mb-1.5 text-xs">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="w-full pl-10 pr-3 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Steve Wanga" />
              </div>
            </motion.div>
          )}
          <div>
            <label className="label-caps text-muted-foreground block mb-1.5 text-xs">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-10 pr-3 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="label-caps text-muted-foreground block mb-1.5 text-xs">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full pl-10 pr-3 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••" />
            </div>
          </div>
          {isAdminRequest && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <label className="label-caps text-muted-foreground block mb-1.5 text-xs">Why do you need admin access?</label>
              <textarea value={adminReason} onChange={e => setAdminReason(e.target.value)}
                className="w-full px-3 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                placeholder="e.g. I'm a store manager" rows={2} />
            </motion.div>
          )}
          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-amber-light text-primary-foreground font-heading font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : isAdminRequest ? (
              <><Shield className="w-4 h-4" /> REQUEST ADMIN ACCESS</>
            ) : isSignUp ? (
              <><UserPlus className="w-4 h-4" /> CREATE ACCOUNT</>
            ) : (
              <><LogIn className="w-4 h-4" /> SIGN IN</>
            )}
          </motion.button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            {isSignUp || isAdminRequest ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setIsSignUp(!isSignUp); setIsAdminRequest(false); }} className="text-primary hover:underline font-semibold">
              {isSignUp || isAdminRequest ? "Sign In" : "Sign Up"}
            </button>
          </p>
          {!isAdminRequest && (
            <p className="text-xs text-muted-foreground">
              Are you a store admin?{" "}
              <button onClick={() => { setIsAdminRequest(true); setIsSignUp(false); }} className="text-primary hover:underline font-semibold">
                Request Admin Access
              </button>
            </p>
          )}
          {isAdminRequest && (
            <p className="text-xs text-muted-foreground">
              Just a customer?{" "}
              <button onClick={() => { setIsAdminRequest(false); setIsSignUp(true); }} className="text-primary hover:underline font-semibold">
                Regular Sign Up
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
