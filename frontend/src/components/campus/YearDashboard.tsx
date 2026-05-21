import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Briefcase, BookOpen, Inbox, Star, ArrowRight, Trophy, Coffee, Code2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const yearToInt = (y: string | null | undefined): 1 | 2 | 3 | 4 => {
  if (!y) return 1;
  const m = y.match(/\d/);
  const n = m ? Number(m[0]) : 1;
  return (Math.min(4, Math.max(1, n)) as 1 | 2 | 3 | 4);
};

export const YearDashboard = () => {
  const { profile, user, refreshProfile } = useAuth();
  const nav = useNavigate();
  const yr = yearToInt(profile?.year);

  if (yr === 1) return <SurvivalCard />;
  if (yr === 2) return <DsaStreakCard />;
  if (yr === 3) return <PlacementPrepCard />;
  return <MentorInboxCard />;
};

const Card = ({ children, gradient }: { children: React.ReactNode; gradient?: string }) => (
  <div className={cn("rounded-3xl p-5 shadow-soft border border-border/60 bg-card relative overflow-hidden", gradient)}>
    {children}
  </div>
);

const SurvivalCard = () => {
  const nav = useNavigate();
  const tips = [
    { emoji: "🛏️", label: "Hostel survival" },
    { emoji: "👨‍🏫", label: "Prof ratings" },
    { emoji: "🍽️", label: "Mess hacks" },
    { emoji: "📚", label: "Library guide" },
  ];
  return (
    <Card gradient="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
        <Coffee className="h-3.5 w-3.5" /> 1st year · Campus Survival
      </div>
      <p className="mt-2 font-bold text-base">Welcome to college. Here's your starter pack.</p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {tips.map((t) => (
          <button key={t.label} onClick={() => nav("/campus")} className="text-left p-3 rounded-2xl bg-background/70 hover:bg-background transition-smooth">
            <p className="text-xl">{t.emoji}</p>
            <p className="text-xs font-semibold mt-1">{t.label}</p>
          </button>
        ))}
      </div>
    </Card>
  );
};

const DsaStreakCard = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [streak, setStreak] = useState<{ current: number; longest: number; doneToday: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from("dsa_streaks").select("current_streak,longest_streak,last_completed_date").eq("user_id", user.id).maybeSingle(),
      supabase.from("dsa_completions").select("id").eq("user_id", user.id).eq("completed_on", today).maybeSingle(),
    ]);
    setStreak({
      current: s?.current_streak ?? 0,
      longest: s?.longest_streak ?? 0,
      doneToday: !!c,
    });
  };
  useEffect(() => { load(); }, [user]);

  const markDone = async () => {
    if (!user || busy) return;
    setBusy(true);
    const { error } = await supabase.from("dsa_completions").insert({ user_id: user.id });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    toast.success("🔥 Streak +1 · +5 Aspire points");
    load();
  };

  const c = streak?.current ?? 0;
  return (
    <Card gradient="bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50 dark:from-orange-950/30 dark:via-rose-950/20 dark:to-pink-950/30">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
        <Code2 className="h-3.5 w-3.5" /> 2nd year · DSA Streak
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative">
          <div className={cn("h-20 w-20 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg", c > 0 && "animate-pulse")}>
            <Flame className="h-10 w-10 text-white" fill="white" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full px-2 py-0.5 text-sm font-black border-2 border-rose-500">{c}</div>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-black">{c} day{c === 1 ? "" : "s"} 🔥</p>
          <p className="text-xs text-muted-foreground">Longest: {streak?.longest ?? 0} · Keep the flame alive</p>
        </div>
      </div>
      <button onClick={markDone} disabled={!!streak?.doneToday || busy} className="mt-4 w-full py-3 rounded-2xl bg-foreground text-background font-bold text-sm disabled:opacity-50">
        {streak?.doneToday ? "✓ Done for today — see you tomorrow" : busy ? "Saving…" : "Mark today's challenge done (+5)"}
      </button>
    </Card>
  );
};

const PlacementPrepCard = () => {
  const nav = useNavigate();
  const cats = [
    { id: "product", label: "Product", emoji: "🚀" },
    { id: "service", label: "Service", emoji: "💼" },
    { id: "fintech", label: "Fintech", emoji: "💳" },
    { id: "gcc", label: "GCC", emoji: "🌐" },
  ];
  return (
    <Card gradient="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
        <Briefcase className="h-3.5 w-3.5" /> 3rd year · Placement Prep
      </div>
      <p className="mt-2 font-bold text-base">Filter by company type. Learn from seniors.</p>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {cats.map((c) => (
          <button key={c.id} onClick={() => nav("/interview")} className="text-center p-2.5 rounded-2xl bg-background/70 hover:bg-background transition-smooth">
            <p className="text-xl">{c.emoji}</p>
            <p className="text-[10px] font-bold mt-1">{c.label}</p>
          </button>
        ))}
      </div>
      <button onClick={() => nav("/interview")} className="mt-3 w-full py-2.5 rounded-2xl bg-foreground text-background font-bold text-xs flex items-center justify-center gap-1.5">
        Open Placement Hub <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
};

const MentorInboxCard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [requests, setRequests] = useState<{ id: string; topic: string; message: string; requester_id: string; created_at: string }[]>([]);
  const isMentor = !!profile?.mentor_mode;

  useEffect(() => {
    if (!user || !isMentor) return;
    supabase
      .from("mentorship_requests")
      .select("id,topic,message,requester_id,created_at")
      .eq("mentor_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error("[MentorInbox]", error); return; }
        setRequests((data ?? []) as { id: string; topic: string; message: string; requester_id: string; created_at: string }[]);
      });
  }, [user, isMentor]);

  const toggle = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ mentor_mode: !isMentor }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success(!isMentor ? "🌟 You are now a Campus Legend" : "Switched back to Candidate mode");
    refreshProfile();
  };

  return (
    <Card gradient="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        <Trophy className="h-3.5 w-3.5" /> 4th year · {isMentor ? "Campus Legend" : "Candidate"}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-sm">Mentor Toggle</p>
          <p className="text-[11px] text-muted-foreground">{isMentor ? "Showing junior requests" : "Showing your job feed"}</p>
        </div>
        <button onClick={toggle} className={cn("relative h-7 w-12 rounded-full transition-smooth", isMentor ? "bg-emerald-500" : "bg-muted")} aria-label="Toggle mentor mode">
          <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", isMentor ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>
      {isMentor ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase"><Inbox className="h-3 w-3" /> {requests.length} junior request{requests.length === 1 ? "" : "s"}</div>
          {requests.slice(0, 3).map((r) => (
            <button key={r.id} onClick={() => nav(`/u/${r.requester_id}`)} className="w-full text-left p-3 rounded-2xl bg-background/70 hover:bg-background transition-smooth">
              <p className="text-xs font-bold">{r.topic}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{r.message || "(no message)"}</p>
            </button>
          ))}
          {requests.length === 0 && <p className="text-xs text-muted-foreground p-3 bg-background/50 rounded-xl text-center">No requests yet — share advice to attract juniors.</p>}
        </div>
      ) : (
        <button onClick={() => nav("/interview")} className="mt-3 w-full py-2.5 rounded-2xl bg-foreground text-background font-bold text-xs flex items-center justify-center gap-1.5">
          Open job feed <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </Card>
  );
};
