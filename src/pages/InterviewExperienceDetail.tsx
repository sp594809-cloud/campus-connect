import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Calendar, ChevronDown, Code2, Hash, Loader2, ShieldCheck, Sparkles, Target, TrendingUp, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_CATEGORIES, INTERVIEWER_BEHAVIORS, ROUND_TYPES } from "@/data/placement";
import { cn } from "@/lib/utils";

interface Exp {
  id: string; company_name: string; company_category: string; role: string; role_type: string;
  application_source: string; ctc_lpa: number | null; outcome: string; rejection_round: string | null;
  interview_year: number; overall_difficulty: string; interviewer_behavior: string | null;
  mistakes: string; strategy: string; anonymous: boolean; verified: boolean; author_id: string;
  created_at: string;
  author: { name: string; avatar_url: string | null; branch: string | null; year: string | null } | null;
}
interface Round {
  id: string; round_number: number; round_type: string; duration_minutes: number | null;
  difficulty: string; question_types: string[]; description: string; code_snippet: string | null; code_language: string | null;
}

const InterviewExperienceDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [exp, setExp] = useState<Exp | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: e, error } = await supabase
        .from("interview_experiences")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) console.error("interview detail error", error);
      let author = null as Exp["author"];
      if (e?.author_id && !e.anonymous) {
        const { data: p } = await supabase
          .from("profiles")
          .select("name,avatar_url,branch,year")
          .eq("id", e.author_id)
          .maybeSingle();
        author = (p as any) ?? null;
      }
      setExp(e ? ({ ...(e as any), author } as Exp) : null);
      const { data: r } = await supabase.from("interview_rounds").select("*").eq("experience_id", id).order("round_number");
      setRounds((r ?? []) as Round[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!exp) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-base font-semibold">This experience couldn't be loaded.</p>
      <p className="text-sm text-muted-foreground">It may have been removed or you don't have access.</p>
      <button onClick={() => nav("/interview")} className="mt-2 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-bold">Back to Placement Hub</button>
    </div>
  );

  const cat = COMPANY_CATEGORIES.find((c) => c.id === exp.company_category);
  const outcomeMap: Record<string, string> = { selected: "bg-success/15 text-success", rejected: "bg-destructive/15 text-destructive", waitlisted: "bg-secondary text-secondary-foreground", withdrew: "bg-muted text-muted-foreground" };
  const diffMap: Record<string, string> = { easy: "text-success", medium: "text-amber-600", hard: "text-destructive" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
      <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-elevated pb-10">
        <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
          <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
        </div>

        <div className="p-5">
          <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5 shadow-elevated relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
            <p className="text-3xl">{cat?.emoji}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <h1 className="text-2xl font-bold">{exp.company_name}</h1>
              {exp.verified && <ShieldCheck className="h-4 w-4" />}
            </div>
            <p className="text-sm opacity-90">{exp.role} · {exp.interview_year}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold uppercase", outcomeMap[exp.outcome])}>{exp.outcome}</span>
              <span className="px-2.5 py-1 rounded-full bg-primary-foreground/20 text-[11px] font-bold uppercase">{cat?.label}</span>
              <span className="px-2.5 py-1 rounded-full bg-primary-foreground/20 text-[11px] font-bold uppercase">{exp.role_type.replace("_", " ")}</span>
              {exp.ctc_lpa && <span className="px-2.5 py-1 rounded-full bg-primary-foreground/20 text-[11px] font-bold">{exp.ctc_lpa} LPA</span>}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Stat Icon={Hash} label="Rounds" value={String(rounds.length)} />
            <Stat Icon={TrendingUp} label="Difficulty" value={exp.overall_difficulty} accent={diffMap[exp.overall_difficulty]} />
            <Stat Icon={Target} label="Source" value={exp.application_source.replace("_", " ")} />
            <Stat Icon={User} label="Author" value={exp.anonymous ? "Anonymous" : (exp.author?.name?.split(" ")[0] ?? "—")} />
          </div>

          <h3 className="font-bold mt-6 mb-3">Round-by-round</h3>
          <div className="space-y-3">
            {rounds.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{r.round_number}</span>
                  <p className="font-bold text-sm">{ROUND_TYPES.find((t) => t.id === r.round_type)?.label ?? r.round_type}</p>
                  <span className={cn("ml-auto text-[11px] font-bold uppercase", diffMap[r.difficulty])}>{r.difficulty}</span>
                </div>
                {r.duration_minutes && <p className="text-[11px] text-muted-foreground mt-1">{r.duration_minutes} min</p>}
                {r.question_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.question_types.map((t) => <span key={t} className="text-[10px] font-semibold bg-accent-soft text-accent px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                )}
                {r.description && <p className="text-sm mt-3 whitespace-pre-wrap text-foreground/90">{r.description}</p>}
                {r.code_snippet && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Code2 className="h-3 w-3" /> {r.code_language}</p>
                    <pre className="bg-foreground text-background p-3 rounded-xl text-[11px] overflow-x-auto whitespace-pre-wrap font-mono">{r.code_snippet}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {(exp.mistakes || exp.strategy) && (
            <div className="mt-6 space-y-3">
              {exp.strategy && (
                <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
                  <p className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> What worked</p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{exp.strategy}</p>
                </div>
              )}
              {exp.mistakes && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-xs font-bold text-destructive uppercase tracking-wider">Mistakes / would do differently</p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{exp.mistakes}</p>
                </div>
              )}
            </div>
          )}

          {exp.interviewer_behavior && (
            <div className="mt-4 rounded-2xl bg-secondary p-3 flex items-center gap-2 text-sm">
              <span className="text-xl">{INTERVIEWER_BEHAVIORS.find((b) => b.id === exp.interviewer_behavior)?.emoji}</span>
              <span className="font-semibold">Interviewer: {INTERVIEWER_BEHAVIORS.find((b) => b.id === exp.interviewer_behavior)?.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ Icon, label, value, accent }: { Icon: typeof Hash; label: string; value: string; accent?: string }) => (
  <div className="rounded-2xl bg-card border border-border/60 p-3">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</p>
    <p className={cn("text-sm font-bold mt-0.5 capitalize", accent)}>{value}</p>
  </div>
);

export default InterviewExperienceDetail;