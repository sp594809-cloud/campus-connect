import { ShieldX, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Banned = () => {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card rounded-3xl shadow-elevated p-7 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
          <ShieldX className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mt-4">Account suspended</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Your account has been permanently banned for violating our zero-tolerance policy on hate speech, threats, or harassment.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          If you believe this was a mistake, email <a className="underline" href="mailto:trust@campusos.app">trust@campusos.app</a> with your account details.
        </p>
        <button onClick={signOut} className="mt-6 w-full py-3 rounded-2xl bg-secondary text-secondary-foreground font-semibold text-sm flex items-center justify-center gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
};

export default Banned;