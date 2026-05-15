import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Briefcase, GitCompare, Plus, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { COMPANY_CATEGORIES, type CompanyCategory } from "@/data/placement";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const EXPERIENCES_PAGE_SIZE = 60;

interface Row {
  id: string;
  company_name: string;
  company_category: CompanyCategory;
  role: string;
  outcome: "selected" | "rejected" | "waitlisted" | "withdrew";
  overall_difficulty: "easy" | "medium" | "hard";
  interview_year: number;
  application_source: string;
  anonymous: boolean;
  verified: boolean;
  author_id: string;
  created_at: string;
  rounds: { count: number }[];
  author: { name: string; avatar_url: string | null; branch: string | null } | null;
}

interface RawRow extends Omit<Row, "author"> {
  author: { id: string; name: string; avatar_url: string | null; branch: string | null } | null;
}

const InterviewExperiences = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const [cat, setCat] = useState<CompanyCategory | "all">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("interview_experiences_public")
      .select(
        "id,company_name,company_category,role,outcome,overall_difficulty,interview_year,application_source,anonymous,verified,author_id,created_at,rounds:interview_rounds(count)"
      )
      .order("created_at", { ascending: false })
      .limit(EXPERIENCES_PAGE_SIZE);
    if (error) console.error("experiences load error", error);
    const base = (data ?? []) as unknown as Omit<RawRow, "author">[];
    const ids = Array.from(new Set(base.filter((b) => !b.anonymous && b.author_id).map((b) => b.author_id)));
    let authorMap: Record<string, NonNullable<RawRow["author"]>> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,name,avatar_url,branch")
        .in("id", ids);
      authorMap = Object.fromEntries(((profs ?? []) as NonNullable<RawRow["author"]>[]).map((p) => [p.id, p]));
    }
    setRows(base.map((b) => ({ ...b, author: b.anonymous ? null : (authorMap[b.author_id] ?? null) })));
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (cat !== "all" && r.company_category !== cat) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      return r.company_name.toLowerCase().includes(s) || r.role.toLowerCase().includes(s);
    }
    return true;
  }), [rows, cat, q]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
      <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-elevated pb-24">
        <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
          <button onClick={() => navigate("/campus")} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
          <h1 className="font-bold text-base ml-1">Interview Experiences</h1>
        </div>

        <div className="px-5 pt-4">
          <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5 shadow-glow relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90"><Sparkles className="h-3.5 w-3.5" /> Placement Engine</div>
            <p className="mt-2 text-lg font-bold leading-snug">Real stories. Round-by-round. From your seniors.</p>
            <button onClick={() => navigate("/interview/new")} className="mt-3 inline-flex items-center gap-1.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 backdrop-blur px-3 py-1.5 rounded-full text-sm font-semibold">
              <Plus className="h-4 w-4" /> Share your experience (+50 karma)
            </button>
          </div>
        </div>

        <div className="px-5 mt-3 grid grid-cols-3 gap-2">
          <button onClick={() => navigate("/interview/compare")} className="rounded-2xl bg-card border border-border p-3 text-left hover:shadow-soft transition-smooth">
            <GitCompare className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold mt-1">Compare</p>
            <p className="text-[10px] text-muted-foreground">Side-by-side</p>
          </button>
          <button onClick={() => navigate("/mentors")} className="rounded-2xl bg-card border border-border p-3 text-left hover:shadow-soft transition-smooth">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold mt-1">Mentors</p>
            <p className="text-[10px] text-muted-foreground">Ask seniors</p>
          </button>
          <button onClick={() => navigate("/karma")} className="rounded-2xl bg-card border border-border p-3 text-left hover:shadow-soft transition-smooth">
            <Award className="h-4 w-4 text-accent" />
            <p className="text-xs font-bold mt-1">Karma</p>
            <p className="text-[10px] text-muted-foreground">Badges & rank</p>
          </button>
        </div>

        <div className="px-5 mt-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company or role…" className="w-full pl-9 pr-4 py-2.5 rounded-full bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div className="px-5 mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>
          {COMPANY_CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              <span className="mr-1">{c.emoji}</span>{c.label}
            </Chip>
          ))}
        </div>

        <div className="px-5 mt-4 space-y-3">
          {busy && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
          {!busy && filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-semibold">No experiences yet</p>
              <p className="text-sm text-muted-foreground">Be the first to share!</p>
            </div>
          )}
          {filtered.map((r) => {
            const cat = COMPANY_CATEGORIES.find((c) => c.id === r.company_category);
            const outcomeMap = { selected: "bg-success/15 text-success", rejected: "bg-destructive/15 text-destructive", waitlisted: "bg-secondary text-secondary-foreground", withdrew: "bg-muted text-muted-foreground" };
            const diffMap = { easy: "text-success", medium: "text-amber-600", hard: "text-destructive" };
            return (
              <button key={r.id} onClick={() => navigate(`/interview/${r.id}`)} className="w-full text-left rounded-2xl bg-card border border-border/60 shadow-soft p-4 hover:shadow-elevated transition-smooth">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl">{cat?.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm truncate">{r.company_name}</p>
                      {r.verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> {r.role} · {r.interview_year}</p>
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-full", outcomeMap[r.outcome])}>{r.outcome}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="font-semibold">{r.rounds?.[0]?.count ?? 0} rounds</span>
                  <span className={cn("font-semibold", diffMap[r.overall_difficulty])}>● {r.overall_difficulty}</span>
                  <span className="ml-auto">{r.anonymous ? "Anonymous" : (r.author?.name ?? "—")}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={cn("px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-smooth", active ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground")}>{children}</button>
);

export default InterviewExperiences;