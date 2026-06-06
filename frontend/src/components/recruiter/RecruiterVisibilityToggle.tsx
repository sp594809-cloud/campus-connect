import { useEffect, useState } from "react";
import { Briefcase, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const RecruiterVisibilityToggle = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setEnabled(!!(profile as unknown as { recruiter_visible?: boolean }).recruiter_visible);
  }, [profile]);

  const persist = async (next: boolean) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ recruiter_visible: next } as never).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setEnabled(next);
    await refreshProfile();
    toast.success(next ? "You're visible to recruiters" : "Hidden from recruiters");
  };

  const onToggle = () => {
    if (enabled) {
      // Reversible immediately; no confirmation needed when turning off.
      persist(false);
    } else {
      setConfirming(true);
    }
  };

  return (
    <div className="rounded-3xl border border-primary/30 bg-gradient-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Briefcase className="h-4 w-4" /></div>
        <div className="flex-1">
          <p className="font-bold text-sm flex items-center gap-1.5">Visible to recruiters {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}</p>
          <p className="text-[11px] text-muted-foreground">Off by default. Turn on to show up in the recruiter dashboard.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          className={cn("relative h-6 w-11 rounded-full transition-smooth shrink-0", enabled ? "bg-primary" : "bg-secondary")}
        >
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-soft transition-smooth", enabled ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>

      {confirming && !enabled && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed space-y-2 animate-fade-in-up">
          <p className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Your profile, skills, karma, and passport will be visible to verified recruiters on CampusOS.
              You can turn this off anytime.
            </span>
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold">Not now</button>
            <button onClick={() => { setConfirming(false); persist(true); }} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">Make me visible</button>
          </div>
        </div>
      )}
    </div>
  );
};