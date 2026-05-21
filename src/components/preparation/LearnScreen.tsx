import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BookOpen, ExternalLink, Flame, Loader2, Sparkles, Trophy, Zap, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Track = {
  id: string; slug: string; name: string; category: string;
  icon: string; description: string; source_base_url: string;
  branches: string[]; is_common: boolean;
};
type Plan = {
  id: string; user_id: string; track_id: string; level: string;
  pace_days: number; current_day: number; status: string;
  started_at: string; completed_at: string | null;
};
type Task = {
  id: string; plan_id: string; day_number: number; topic_title: string;
  question: string; exercise_prompt: string; expected_answer_summary: string;
  source_url: string; difficulty: string;
};
type Submission = {
  id: string; task_id: string; ai_score: number; ai_feedback: string;
  ai_mistakes: string; ai_hint: string; passed: boolean; submitted_at: string;
};

type View =
  | { name: "list" }
  | { name: "placement"; track: Track }
  | { name: "setup"; track: Track; level: string }
  | { name: "plan"; planId: string }
  | { name: "task"; planId: string; taskId: string };

// New prep tables aren't in generated types yet; cast to any for runtime use.
const sb = supabase as unknown as any;

export function LearnScreen() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ name: "list" });

  const { data: tracks } = useQuery({
    queryKey: ["learn-tracks"],
    queryFn: async () => {
      const { data, error } = await sb.from("learning_tracks").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Track[];
    },
  });

  const { data: activePlans } = useQuery({
    queryKey: ["learn-plans", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb.from("user_learning_plans")
        .select("*").eq("user_id", user!.id).order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });

  const branch = profile?.branch ?? "";
  const filteredTracks = useMemo(() => {
    if (!tracks) return [];
    return tracks.filter(t => t.is_common || t.branches.length === 0 || t.branches.includes(branch));
  }, [tracks, branch]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["learn-plans"] });
  };

  if (view.name === "placement")
    return <PlacementView track={view.track} onBack={() => setView({ name: "list" })}
      onDone={(level) => setView({ name: "setup", track: view.track, level })} />;

  if (view.name === "setup")
    return <SetupView track={view.track} level={view.level}
      onBack={() => setView({ name: "placement", track: view.track })}
      onCreated={(planId) => { refresh(); setView({ name: "plan", planId }); }} />;

  if (view.name === "plan")
    return <PlanView planId={view.planId}
      onBack={() => setView({ name: "list" })}
      onOpenTask={(taskId) => setView({ name: "task", planId: view.planId, taskId })} />;

  if (view.name === "task")
    return <TaskView taskId={view.taskId}
      onBack={() => setView({ name: "plan", planId: view.planId })}
      onPassed={() => refresh()} />;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Learn & Grow</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Personalised daily tracks. Earn karma. Level up.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activePlans && activePlans.filter(p => p.status === "active").length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Continue learning
            </h2>
            <div className="space-y-2">
              {activePlans.filter(p => p.status === "active").map(p => {
                const t = tracks?.find(x => x.id === p.track_id);
                return (
                  <Card key={p.id}
                    className="p-3 cursor-pointer hover:bg-accent/40 transition-colors"
                    onClick={() => setView({ name: "plan", planId: p.id })}>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{t?.icon ?? "📘"}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{t?.name ?? "Track"}</p>
                        <p className="text-xs text-muted-foreground">
                          Day {p.current_day} of {p.pace_days} · {p.level}
                        </p>
                      </div>
                      <Badge variant="secondary">{Math.round((p.current_day - 1) / p.pace_days * 100)}%</Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Pick a track {branch && <span className="normal-case text-foreground/60">· for {branch}</span>}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {filteredTracks.map(t => (
              <button key={t.id}
                onClick={() => setView({ name: "placement", track: t })}
                className="text-left rounded-xl border border-border/60 bg-card p-3 hover:border-primary/60 hover:shadow-soft transition-all">
                <div className="flex items-start gap-2">
                  <div className="text-2xl">{t.icon}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight">{t.name}</p>
                    {t.is_common && <Badge variant="outline" className="mt-1 text-[10px]">For everyone</Badge>}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{t.description}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur z-10">
      <button onClick={onBack} className="p-1 -ml-1 rounded hover:bg-accent">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h2 className="font-semibold text-sm">{title}</h2>
    </div>
  );
}

type MCQ = { q: string; options: string[]; correctIndex: number; difficulty: string };

function PlacementView({ track, onBack, onDone }: { track: Track; onBack: () => void; onDone: (level: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [qs, setQs] = useState<MCQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await sb.functions.invoke("prep-placement-quiz", {
          body: { trackName: track.name, trackSlug: track.slug },
        });
        if (error) throw error;
        setQs((data?.questions ?? []) as MCQ[]);
      } catch (e) {
        toast({ title: "Could not load quiz", description: String(e), variant: "destructive" });
      } finally { setLoading(false); }
    })();
  }, [track]);

  const submitFinal = async (allPicks: number[]) => {
    setSubmitting(true);
    try {
      const answers = qs.map((q, i) => ({ correct: allPicks[i] === q.correctIndex }));
      const { data, error } = await sb.functions.invoke("prep-placement-quiz", { body: { answers } });
      if (error) throw error;
      toast({ title: `You're at ${data.level} level (${data.score}/${data.total})` });
      onDone(data.level);
    } catch (e) {
      toast({ title: "Scoring failed", description: String(e), variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const pick = (optionIdx: number) => {
    const next = [...picks, optionIdx];
    setPicks(next);
    if (idx + 1 < qs.length) setIdx(idx + 1);
    else submitFinal(next);
  };

  if (loading) return (
    <div className="flex flex-col h-full">
      <ScreenHeader title={`Placement: ${track.name}`} onBack={onBack} />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </div>
  );

  if (submitting) return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Scoring..." onBack={onBack} />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </div>
  );

  const q = qs[idx];
  if (!q) return null;

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title={`Placement: ${track.name}`} onBack={onBack} />
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs text-muted-foreground mb-2">
          Question {idx + 1} of {qs.length} · <span className="capitalize">{q.difficulty}</span>
        </p>
        <Card className="p-4 mb-4">
          <p className="font-medium text-sm leading-relaxed">{q.q}</p>
        </Card>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => pick(i)}
              className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/40 transition-colors text-sm">
              <span className="font-semibold mr-2 text-primary">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupView({ track, level, onBack, onCreated }: {
  track: Track; level: string; onBack: () => void; onCreated: (planId: string) => void;
}) {
  const [pace, setPace] = useState(14);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const { data, error } = await sb.functions.invoke("prep-generate-plan", {
        body: { trackId: track.id, level, paceDays: pace },
      });
      if (error) throw error;
      onCreated(data.planId);
    } catch (e) {
      toast({ title: "Could not create plan", description: String(e), variant: "destructive" });
    } finally { setBusy(false); }
  };

  const presets = [7, 14, 28];
  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title={`${track.name} · ${level}`} onBack={onBack} />
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <Card className="p-4">
          <p className="text-sm font-semibold mb-1">Choose your pace</p>
          <p className="text-xs text-muted-foreground mb-3">One task per day, AI-generated, with a trusted reference link.</p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map(p => (
              <button key={p} onClick={() => setPace(p)}
                className={cn("py-3 rounded-lg border text-sm font-medium transition-colors",
                  pace === p ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40")}>
                {p} days
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4 bg-accent/30">
          <div className="flex items-start gap-2">
            <Trophy className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold">Earn karma every day</p>
              <p className="text-muted-foreground">+5 easy · +10 medium · +15 hard. Maintain your streak and unlock the next level.</p>
            </div>
          </div>
        </Card>
        <Button onClick={start} disabled={busy} className="w-full">
          {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating your plan...</> : `Start ${pace}-day plan`}
        </Button>
      </div>
    </div>
  );
}

function PlanView({ planId, onBack, onOpenTask }: { planId: string; onBack: () => void; onOpenTask: (taskId: string) => void }) {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["learn-plan", planId],
    queryFn: async () => {
      const [{ data: plan }, { data: tasks }, { data: subs }] = await Promise.all([
        sb.from("user_learning_plans").select("*").eq("id", planId).single(),
        sb.from("daily_tasks").select("*").eq("plan_id", planId).order("day_number"),
        sb.from("task_submissions").select("*").eq("user_id", user!.id),
      ]);
      return {
        plan: plan as unknown as Plan,
        tasks: (tasks ?? []) as unknown as Task[],
        subs: (subs ?? []) as unknown as Submission[],
      };
    },
  });

  if (isLoading || !data) return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Loading plan..." onBack={onBack} />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </div>
  );

  const { plan, tasks, subs } = data;
  const passedTaskIds = new Set(subs.filter(s => s.passed).map(s => s.task_id));
  const passedCount = tasks.filter(t => passedTaskIds.has(t.id)).length;
  const pct = Math.round((passedCount / plan.pace_days) * 100);

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title={`${plan.level} · ${plan.pace_days} days`} onBack={onBack} />
      <div className="p-4 flex-1 overflow-y-auto">
        <Card className="p-4 mb-4 bg-gradient-to-br from-primary/10 to-accent/20">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-lg font-bold">{passedCount} / {plan.pace_days} days · {pct}%</p>
            </div>
            {plan.status === "completed" && <Badge>Completed 🎉</Badge>}
          </div>
          <div className="h-2 bg-background rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </Card>

        <div className="space-y-2">
          {tasks.map(t => {
            const passed = passedTaskIds.has(t.id);
            const locked = t.day_number > plan.current_day;
            return (
              <button key={t.id} disabled={locked}
                onClick={() => onOpenTask(t.id)}
                className={cn("w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3",
                  passed ? "border-green-500/30 bg-green-500/5" :
                  locked ? "border-border/40 opacity-50 cursor-not-allowed" :
                  "border-border hover:border-primary/60 hover:bg-accent/40")}>
                <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-xs font-bold shrink-0">
                  {passed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : t.day_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.topic_title}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{t.difficulty}</p>
                </div>
                {!locked && !passed && <Zap className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TaskView({ taskId, onBack, onPassed }: { taskId: string; onBack: () => void; onPassed: () => void }) {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState("");
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; feedback: string; mistakes: string; hint: string } | null>(null);
  const [prior, setPrior] = useState<Submission | null>(null);

  useEffect(() => {
    (async () => {
      const { data: t } = await sb.from("daily_tasks").select("*").eq("id", taskId).single();
      setTask(t as unknown as Task);
      const { data: subs } = await sb.from("task_submissions")
        .select("*").eq("task_id", taskId).eq("user_id", user!.id)
        .order("submitted_at", { ascending: false }).limit(1);
      const s = (subs?.[0] ?? null) as unknown as Submission | null;
      setPrior(s);
      if (s) setResult({ score: s.ai_score, passed: s.passed, feedback: s.ai_feedback, mistakes: s.ai_mistakes, hint: s.ai_hint });
    })();
  }, [taskId, user]);

  const grade = useCallback(async () => {
    if (!submission.trim()) {
      toast({ title: "Write your answer first", variant: "destructive" });
      return;
    }
    setGrading(true);
    try {
      const { data, error } = await sb.functions.invoke("prep-grade-submission", {
        body: { taskId, submission },
      });
      if (error) throw error;
      setResult({ score: data.score, passed: data.passed, feedback: data.feedback, mistakes: data.mistakes, hint: data.hint });
      if (data.passed) {
        toast({ title: `+karma! Score ${data.score}/100` });
        onPassed();
      } else {
        toast({ title: `Score ${data.score}/100 — try again`, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Grading failed", description: String(e), variant: "destructive" });
    } finally { setGrading(false); }
  }, [submission, taskId, onPassed]);

  if (!task) return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Loading..." onBack={onBack} />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title={`Day ${task.day_number} · ${task.topic_title}`} onBack={onBack} />
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">{task.difficulty}</Badge>
          <a href={task.source_url} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs flex items-center gap-1 text-primary hover:underline">
            <BookOpen className="h-3 w-3" /> Read source <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Question</p>
          <p className="text-sm leading-relaxed font-medium">{task.question}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Exercise</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.exercise_prompt}</p>
        </Card>

        <div>
          <p className="text-xs font-semibold mb-1">Your answer / code</p>
          <Textarea
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
            placeholder="Paste your code or write your answer here..."
            rows={8}
            className="font-mono text-xs"
          />
        </div>

        <Button onClick={grade} disabled={grading} className="w-full">
          {grading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Grading with AI...</> : "Submit for AI review"}
        </Button>

        {result && (
          <Card className={cn("p-4", result.passed ? "border-green-500/40 bg-green-500/5" : "border-amber-500/40 bg-amber-500/5")}>
            <div className="flex items-center gap-2 mb-2">
              {result.passed
                ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                : <XCircle className="h-5 w-5 text-amber-600" />}
              <p className="font-bold text-sm">{result.passed ? "Passed!" : "Keep going"} · {result.score}/100</p>
            </div>
            {result.feedback && <p className="text-xs mb-2"><span className="font-semibold">Feedback:</span> {result.feedback}</p>}
            {result.mistakes && <p className="text-xs mb-2"><span className="font-semibold">Mistakes:</span> {result.mistakes}</p>}
            {result.hint && <p className="text-xs"><span className="font-semibold">Hint:</span> {result.hint}</p>}
          </Card>
        )}
      </div>
    </div>
  );
}