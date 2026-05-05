import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Code2, GripVertical, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  APPLICATION_SOURCES, COMPANY_CATEGORIES, DIFFICULTY, INTERVIEWER_BEHAVIORS,
  OUTCOMES, QUESTION_TAGS, ROLE_TYPES, ROUND_TYPES, type CompanyCategory,
} from "@/data/placement";
import { cn } from "@/lib/utils";

type Diff = "easy" | "medium" | "hard";
type Round = {
  round_type: string;
  duration_minutes: number;
  difficulty: Diff;
  question_types: string[];
  description: string;
  code_snippet: string;
  code_language: string;
  showCode: boolean;
};

const blankRound = (): Round => ({
  round_type: "technical", duration_minutes: 60, difficulty: "medium",
  question_types: [], description: "", code_snippet: "", code_language: "java", showCode: false,
});

const InterviewPostFlow = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState<CompanyCategory>("product");
  const [role, setRole] = useState("");
  const [roleType, setRoleType] = useState<"internship" | "full_time" | "ppo">("full_time");
  const [year, setYear] = useState(new Date().getFullYear());
  const [source, setSource] = useState<"tpo" | "referral" | "off_campus" | "linkedin" | "pool_campus">("tpo");

  // Step 2
  const [outcome, setOutcome] = useState<"selected" | "rejected" | "waitlisted" | "withdrew">("selected");
  const [ctc, setCtc] = useState<number | "">("");
  const [rejectionRound, setRejectionRound] = useState("");
  const [overallDiff, setOverallDiff] = useState<Diff>("medium");

  // Step 3
  const [rounds, setRounds] = useState<Round[]>([blankRound()]);

  // Step 4
  const [behavior, setBehavior] = useState<"friendly" | "neutral" | "stress_test" | "rude">("neutral");
  const [mistakes, setMistakes] = useState("");
  const [strategy, setStrategy] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const canNext = () => {
    if (step === 1) return company.trim() && role.trim();
    if (step === 3) return rounds.length > 0;
    return true;
  };

  const submit = async () => {
    if (!user) { toast.error("Sign in first"); return; }
    setSubmitting(true);
    const { data: exp, error } = await supabase.from("interview_experiences").insert({
      author_id: user.id,
      company_name: company.trim(),
      company_category: category,
      role: role.trim(),
      role_type: roleType,
      application_source: source,
      ctc_lpa: typeof ctc === "number" ? ctc : null,
      outcome,
      rejection_round: outcome === "rejected" ? rejectionRound.trim() || null : null,
      interview_year: year,
      overall_difficulty: overallDiff,
      interviewer_behavior: behavior,
      mistakes: mistakes.trim(),
      strategy: strategy.trim(),
      anonymous,
    }).select("id").single();

    if (error || !exp) { toast.error(error?.message ?? "Failed to save"); setSubmitting(false); return; }

    if (rounds.length) {
      const payload = rounds.map((r, i) => ({
        experience_id: exp.id,
        round_number: i + 1,
        round_type: r.round_type as any,
        duration_minutes: r.duration_minutes,
        difficulty: r.difficulty,
        question_types: r.question_types,
        description: r.description.trim(),
        code_snippet: r.showCode ? r.code_snippet.trim() || null : null,
        code_language: r.showCode ? r.code_language : null,
      }));
      const { error: e2 } = await supabase.from("interview_rounds").insert(payload);
      if (e2) { toast.error(e2.message); setSubmitting(false); return; }
    }
    toast.success("Posted! +50 karma 🎉");
    nav(`/interview/${exp.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
      <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-elevated">
        <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
          <button onClick={() => (step > 1 ? setStep(step - 1) : nav(-1))} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
          <h1 className="font-bold text-base ml-1">Step {step} / 5</h1>
        </div>

        <div className="px-5 pt-3">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-hero transition-all" style={{ width: `${(step / 5) * 100}%` }} />
          </div>
        </div>

        <div className="p-5 pb-24">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-xl font-bold">Company & Role</h2>
              <Field label="Company name">
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Razorpay" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </Field>
              <Field label="Category">
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => setCategory(c.id)} className={cn("text-left p-3 rounded-2xl border transition-smooth", category === c.id ? "border-primary bg-accent-soft" : "border-border bg-card")}>
                      <p className="text-sm font-bold">{c.emoji} {c.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Role">
                <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. SDE Intern, Data Analyst" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </Field>
              <Field label="Role type">
                <Segmented options={ROLE_TYPES.map((r) => ({ id: r.id, label: r.label }))} value={roleType} onChange={(v) => setRoleType(v as any)} />
              </Field>
              <Field label="Application source">
                <Segmented options={APPLICATION_SOURCES.map((r) => ({ id: r.id, label: r.label }))} value={source} onChange={(v) => setSource(v as any)} />
              </Field>
              <Field label="Interview year">
                <input type="number" value={year} min={2018} max={new Date().getFullYear() + 1} onChange={(e) => setYear(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-xl font-bold">Outcome</h2>
              <div className="grid grid-cols-2 gap-2">
                {OUTCOMES.map((o) => (
                  <button key={o.id} onClick={() => setOutcome(o.id)} className={cn("p-4 rounded-2xl border transition-smooth text-center", outcome === o.id ? "border-primary bg-accent-soft" : "border-border bg-card")}>
                    <p className="text-3xl">{o.emoji}</p>
                    <p className="text-sm font-bold mt-1">{o.label}</p>
                  </button>
                ))}
              </div>
              {outcome === "selected" && (
                <Field label="CTC (LPA, optional)">
                  <input type="number" value={ctc} onChange={(e) => setCtc(e.target.value ? Number(e.target.value) : "")} placeholder="e.g. 18" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </Field>
              )}
              {outcome === "rejected" && (
                <Field label="Rejected at which round?">
                  <input value={rejectionRound} onChange={(e) => setRejectionRound(e.target.value)} placeholder="e.g. Technical Round 2" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </Field>
              )}
              <Field label="Overall difficulty">
                <Segmented options={DIFFICULTY.map((d) => ({ id: d.id, label: d.label }))} value={overallDiff} onChange={(v) => setOverallDiff(v as Diff)} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 animate-fade-in-up">
              <h2 className="text-xl font-bold">Rounds</h2>
              <p className="text-xs text-muted-foreground">Add a card for each round. The more detail, the more karma.</p>
              {rounds.map((r, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <p className="font-bold text-sm">Round {idx + 1}</p>
                    <button onClick={() => setRounds(rounds.filter((_, i) => i !== idx))} disabled={rounds.length === 1} className="ml-auto text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <select value={r.round_type} onChange={(e) => setRounds(rounds.map((x, i) => i === idx ? { ...x, round_type: e.target.value } : x))} className="w-full px-3 py-2.5 rounded-xl bg-secondary text-sm focus:outline-none">
                    {ROUND_TYPES.map((rt) => <option key={rt.id} value={rt.id}>{rt.label}</option>)}
                  </select>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex-1">Duration: <b>{r.duration_minutes} min</b>
                      <input type="range" min={15} max={180} step={15} value={r.duration_minutes} onChange={(e) => setRounds(rounds.map((x, i) => i === idx ? { ...x, duration_minutes: Number(e.target.value) } : x))} className="w-full" />
                    </label>
                  </div>
                  <Segmented options={DIFFICULTY.map((d) => ({ id: d.id, label: d.label }))} value={r.difficulty} onChange={(v) => setRounds(rounds.map((x, i) => i === idx ? { ...x, difficulty: v as Diff } : x))} />
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Question types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUESTION_TAGS.map((t) => {
                        const on = r.question_types.includes(t);
                        return (
                          <button key={t} onClick={() => setRounds(rounds.map((x, i) => i === idx ? { ...x, question_types: on ? x.question_types.filter((q) => q !== t) : [...x.question_types, t] } : x))} className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold", on ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground")}>{t}</button>
                        );
                      })}
                    </div>
                  </div>
                  <textarea value={r.description} onChange={(e) => setRounds(rounds.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} rows={3} placeholder="What happened in this round? Questions asked, vibe…" className="w-full px-3 py-2.5 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  <button onClick={() => setRounds(rounds.map((x, i) => i === idx ? { ...x, showCode: !x.showCode } : x))} className="text-xs font-semibold flex items-center gap-1 text-primary"><Code2 className="h-3.5 w-3.5" /> {r.showCode ? "Remove code block" : "Add code block"}</button>
                  {r.showCode && (
                    <div className="space-y-2">
                      <select value={r.code_language} onChange={(e) => setRounds(rounds.map((x, i) => i === idx ? { ...x, code_language: e.target.value } : x))} className="px-3 py-1.5 rounded-lg bg-secondary text-xs">
                        {["java", "python", "cpp", "javascript", "go"].map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <textarea value={r.code_snippet} onChange={(e) => setRounds(rounds.map((x, i) => i === idx ? { ...x, code_snippet: e.target.value } : x))} rows={5} placeholder="// paste code or pseudo-code…" className="w-full px-3 py-2.5 rounded-xl bg-foreground text-background font-mono text-xs focus:outline-none resize-none" />
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setRounds([...rounds, blankRound()])} className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary"><Plus className="h-4 w-4" /> Add round</button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-xl font-bold">Reflection</h2>
              <Field label="Interviewer behavior">
                <div className="grid grid-cols-4 gap-2">
                  {INTERVIEWER_BEHAVIORS.map((b) => (
                    <button key={b.id} onClick={() => setBehavior(b.id)} className={cn("p-3 rounded-2xl border text-center", behavior === b.id ? "border-primary bg-accent-soft" : "border-border bg-card")}>
                      <p className="text-xl">{b.emoji}</p>
                      <p className="text-[10px] font-semibold mt-1">{b.label}</p>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Mistakes you made">
                <textarea value={mistakes} onChange={(e) => setMistakes(e.target.value.slice(0, 600))} rows={4} placeholder="What would you do differently?" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </Field>
              <Field label="What worked / strategy">
                <textarea value={strategy} onChange={(e) => setStrategy(e.target.value.slice(0, 600))} rows={4} placeholder="Resources, mindset, prep timeline…" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-xl font-bold">Review & publish</h2>
              <div className="rounded-2xl bg-gradient-card border border-border/60 p-4 space-y-2">
                <p className="text-lg font-bold">{company} <span className="text-sm font-normal text-muted-foreground">· {role}</span></p>
                <p className="text-xs text-muted-foreground">{COMPANY_CATEGORIES.find((c) => c.id === category)?.label} · {year} · via {APPLICATION_SOURCES.find((s) => s.id === source)?.label}</p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-secondary font-semibold">{OUTCOMES.find((o) => o.id === outcome)?.emoji} {outcome}</span>
                  <span className="px-2 py-1 rounded-full bg-secondary font-semibold">{rounds.length} rounds</span>
                  <span className="px-2 py-1 rounded-full bg-secondary font-semibold">{overallDiff}</span>
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-secondary cursor-pointer">
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Post anonymously</p>
                  <p className="text-[11px] text-muted-foreground">Branch + year still shown, name hidden.</p>
                </div>
              </label>
              <button onClick={submit} disabled={submitting} className="w-full py-3.5 rounded-2xl bg-gradient-hero text-primary-foreground font-bold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
                <Send className="h-4 w-4" /> {submitting ? "Publishing…" : "Publish (+50 karma)"}
              </button>
            </div>
          )}
        </div>

        {step < 5 && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-background/90 backdrop-blur border-t border-border">
            <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()} className="w-full py-3 rounded-2xl bg-foreground text-background font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
    {children}
  </div>
);

const Segmented = ({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((o) => (
      <button key={o.id} onClick={() => onChange(o.id)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold", value === o.id ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground")}>{o.label}</button>
    ))}
  </div>
);

export default InterviewPostFlow;