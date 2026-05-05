import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Crown, Loader2, Medal, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BADGES, currentBadge, nextBadge } from "@/data/badges";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Event { id: string; action: string; points: number; note: string; created_at: string; }
interface LeaderRow { id: string; name: string; avatar_url: string | null; karma_total: number; branch: string | null; }

const ACTION_LABEL: Record<string, string> = {
  interview_post: "Interview experience posted",
  mentorship_completed: "Mentorship session completed",
  advice_upvoted: "Your post got upvoted",
  daily_streak: "Daily streak",
  resume_review: "Resume review given",
  mock_interview: "Mock interview",
  aspire_engage: "Engaged with senior content",
};

// Aspire = junior side (learning, engaging). Legacy = senior side (helping others).
const LEGACY_ACTIONS = new Set(["interview_post", "mentorship_completed", "advice_upvoted", "resume_review", "mock_interview"]);

const Karma = () => {
  const nav = useNavigate();
  const { user, profile, loading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [tab, setTab] = useState<"me" | "board">("me");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/", { replace: true }); return; }
    (async () => {
      const [{ data: ev }, { data: lb }] = await Promise.all([
        supabase.from("karma_events").select("id,action,points,note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(40),
        supabase.from("profiles").select("id,name,avatar_url,karma_total,branch").order("karma_total", { ascending: false }).limit(20),
      ]);
      setEvents((ev ?? []) as Event[]);
      setBoard((lb ?? []) as LeaderRow[]);
      setBusy(false);
    })();
  }, [user, loading, nav]);

  if (loading || !profile) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const k = profile.karma_total ?? 0;
  const cur = currentBadge(k);
  const nxt = nextBadge(k);
  const progress = nxt ? Math.min(100, ((k - cur.threshold) / (nxt.threshold - cur.threshold)) * 100) : 100;

  const aspire = events.filter((e) => !LEGACY_ACTIONS.has(e.action)).reduce((s, e) => s + e.points, 0);
  const legacy = events.filter((e) => LEGACY_ACTIONS.has(e.action)).reduce((s, e) => s + e.points, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
      <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-elevated pb-10">
        <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
          <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
          <h1 className="font-bold text-base ml-1">Placement Karma</h1>
        </div>

        <div className="p-5">
          <div className={cn("rounded-3xl p-5 text-primary-foreground shadow-elevated relative overflow-hidden bg-gradient-to-br", cur.color)}>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90"><Sparkles className="h-3.5 w-3.5" /> Your tier</div>
            <p className="text-5xl mt-2">{cur.emoji}</p>
            <p className="text-2xl font-bold mt-1">{cur.label}</p>
            <p className="text-3xl font-black mt-2">{k} <span className="text-sm font-normal opacity-80">karma</span></p>
            {nxt && (
              <div className="mt-3">
                <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] opacity-90 mt-1">{nxt.threshold - k} to <b>{nxt.label}</b> {nxt.emoji}</p>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl p-3 border border-border bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">🌱 Aspire</p>
              <p className="text-2xl font-black mt-0.5">{aspire}</p>
              <p className="text-[10px] text-muted-foreground">From learning & engaging</p>
            </div>
            <div className="rounded-2xl p-3 border border-border bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/30 dark:to-rose-950/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">🏛️ Legacy</p>
              <p className="text-2xl font-black mt-0.5">{legacy}</p>
              <p className="text-[10px] text-muted-foreground">From helping juniors</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Tab active={tab === "me"} onClick={() => setTab("me")}>My activity</Tab>
            <Tab active={tab === "board"} onClick={() => setTab("board")}>Leaderboard</Tab>
          </div>

          {tab === "me" && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">All badges</p>
                <div className="grid grid-cols-3 gap-2">
                  {BADGES.map((b) => {
                    const earned = k >= b.threshold;
                    return (
                      <div key={b.id} className={cn("rounded-2xl p-3 text-center border", earned ? "border-primary bg-card" : "border-border bg-secondary/50 opacity-60")}>
                        <p className="text-2xl">{b.emoji}</p>
                        <p className="text-[11px] font-bold mt-1">{b.label}</p>
                        <p className="text-[10px] text-muted-foreground">{b.threshold}+</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent activity</p>
                {busy && <p className="text-center text-sm text-muted-foreground py-6">Loading…</p>}
                {!busy && events.length === 0 && (
                  <div className="text-center py-8 rounded-2xl bg-secondary">
                    <p className="text-3xl mb-2">✨</p>
                    <p className="text-sm font-semibold">Earn your first karma</p>
                    <p className="text-xs text-muted-foreground mt-1">Share an interview experience for +50.</p>
                    <button onClick={() => nav("/interview/new")} className="mt-3 px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold">Post now</button>
                  </div>
                )}
                <div className="space-y-2">
                  {events.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60">
                      <Award className="h-5 w-5 text-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{ACTION_LABEL[e.action] ?? e.action}</p>
                        <p className="text-[11px] text-muted-foreground">{e.note} · {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</p>
                      </div>
                      <span className="text-sm font-bold text-success">+{e.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "board" && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Top of all time</p>
              {board.map((r, i) => {
                const b = currentBadge(r.karma_total);
                const me = r.id === user!.id;
                return (
                  <div key={r.id} className={cn("flex items-center gap-3 p-3 rounded-2xl border", me ? "border-primary bg-accent-soft" : "border-border/60 bg-card")}>
                    <div className="w-7 text-center">
                      {i === 0 ? <Crown className="h-5 w-5 text-yellow-500 mx-auto" /> :
                       i < 3 ? <Medal className="h-5 w-5 text-muted-foreground mx-auto" /> :
                       <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
                    </div>
                    <img src={r.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name)}`} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{r.name}{me && " (you)"}</p>
                      <p className="text-[11px] text-muted-foreground">{b.emoji} {b.label} · {r.branch ?? "—"}</p>
                    </div>
                    <span className="text-sm font-black">{r.karma_total}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Tab = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={cn("flex-1 py-2.5 rounded-full text-xs font-bold", active ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground")}>{children}</button>
);

export default Karma;