import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import networkBg from "@/assets/network-bg.jpg";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  name: z.string().trim().min(1).max(80).optional(),
});

const Auth = () => {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) nav("/", { replace: true });
  }, [session, nav]);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, name: mode === "signup" ? name : undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success("Check your email to verify your account ✉️");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(234 70% 18% / 0.95), hsl(264 75% 30% / 0.92)), url(${networkBg})`,
        backgroundSize: "cover",
      }}
    >
      <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated p-7 animate-scale-in">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">Campus Connect</span>
        </div>
        <h1 className="text-2xl font-bold mt-3">
          {mode === "signup" ? "Hello Krish" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "signup"
            ? "Hello Krish"
            : "Pick up where you left off."}
        </p>

        <button
          onClick={google}
          disabled={busy}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-smooth disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M21.35 11.1h-9.17v2.92h5.28c-.23 1.4-1.66 4.12-5.28 4.12a5.84 5.84 0 010-11.68c1.84 0 3.07.78 3.78 1.45l2.57-2.49C16.39 3.92 14.43 3 12.18 3a9 9 0 100 18c5.2 0 8.65-3.65 8.65-8.79 0-.59-.06-1.04-.16-1.51z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-border flex-1" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">or email</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              maxLength={80}
              className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="College or personal email"
            className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)"
            className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow hover:opacity-95 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-5">
          {mode === "signup" ? "Already on Campus Connect?" : "New here?"}{" "}
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-accent font-semibold hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create account"}
          </button>
        </p>
        <p className="text-[11px] text-center text-muted-foreground/80 mt-3">
          A college email (.edu / .ac.in) gets you a verified badge automatically.
        </p>
      </div>
    </div>
  );
};

export default Auth;