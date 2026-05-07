import { useEffect, useState } from "react";
import { Flame, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Streak { current_streak: number; longest_streak: number; last_completed_date: string | null; total_completed: number; }

const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };

export const StreakBanner = () => {
  const { user } = useAuth();
  const [s, setS] = useState<Streak | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("dsa_streaks").select("current_streak,longest_streak,last_completed_date,total_completed").eq("user_id", user.id).maybeSingle();
    setS((data as Streak) ?? { current_streak: 0, longest_streak: 0, last_completed_date: null, total_completed: 0 });
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  if (!user) return null;

  const t = today();
  const y = yesterday();
  const last = s?.last_completed_date ?? null;
  const doneToday = last === t;
  const atRisk = !doneToday && last === y && (s?.current_streak ?? 0) > 0;
  const broken = !doneToday && last !== y && last !== null;

  const markDone = async () => {
    if (!user || doneToday) return;
    setBusy(true);
    const { error } = await supabase.from("dsa_completions").insert({ user_id: user.id, completed_on: t });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Streak extended! 🔥");
    load();
  };

  if (loading) return null;

  // Loss-aversion framing
  const tone =
    doneToday ? "from-[hsl(var(--success))] to-[hsl(152_60%_30%)]" :
    atRisk    ? "from-[hsl(var(--destructive))] to-[hsl(var(--warning))]" :
    broken    ? "from-slate-500 to-slate-700" :
                "from-[hsl(var(--warning))] to-[hsl(var(--destructive))]";

  const glow =
    doneToday ? "glow-success" :
    atRisk    ? "glow-danger" :
    broken    ? "" :
                "glow-warning";

  const headline =
    doneToday ? "Streak safe today ✅" :
    atRisk    ? "Don't lose your streak!" :
    broken    ? "Start a new streak today" :
                "Begin your daily streak";

  const sub =
    doneToday ? `${s?.current_streak ?? 0}-day streak — see you tomorrow.` :
    atRisk    ? `Your ${s?.current_streak} 🔥 streak resets at midnight.` :
    broken    ? `Your last streak was ${s?.longest_streak} days. Rebuild it.` :
                "One question a day keeps the rust away.";

  return (
    <div className={cn("rounded-2xl p-4 text-white bg-gradient-to-r flex items-center gap-3 animate-fade-in-up", tone, glow)}>
      <div className={cn("h-12 w-12 rounded-full bg-white/15 flex items-center justify-center text-2xl", !doneToday && "animate-flame-flicker")}>
        🔥
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight">{headline}</p>
        <p className="text-[11px] opacity-90 mt-0.5">{sub}</p>
        <p className="text-[10px] opacity-80 mt-1">
          Current <b className="tabular-nums">{s?.current_streak ?? 0}</b> · Best <b className="tabular-nums">{s?.longest_streak ?? 0}</b>
        </p>
      </div>
      <button
        onClick={markDone}
        disabled={busy || doneToday}
        className="px-3 py-2 rounded-full bg-white text-foreground text-xs font-bold shadow-soft disabled:opacity-60 inline-flex items-center gap-1"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flame className="h-3 w-3" />}
        {doneToday ? "Done" : "Mark today"}
      </button>
    </div>
  );
};