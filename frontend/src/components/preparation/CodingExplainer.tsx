import { Loader2, Target, ListOrdered, Code2 } from "lucide-react";
import { useCodingExplain } from "@/lib/api/learn";
import { cn } from "@/lib/utils";

interface Props {
  subject: string;
  topic: string;
  question: string;
  className?: string;
}

export function CodingExplainer({ subject, topic, question, className }: Props) {
  const { data, isLoading, isError, error } = useCodingExplain({ subject, topic, question });

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 p-4 flex items-center gap-3", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
        <span className="text-sm text-muted-foreground">Generating expected output & approach…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn("rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-400", className)}>
        Could not load the explainer. {error instanceof Error ? error.message : ""}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Expected Output */}
      <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            🎯 Expected Output
          </p>
          {data.cached && <span className="text-[10px] text-muted-foreground ml-auto">cached</span>}
        </div>
        <pre className="text-sm font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed">{data.expected_output}</pre>
      </div>

      {/* Logic Steps */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ListOrdered className="w-4 h-4 text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider text-primary">💡 How it works</p>
        </div>
        <ol className="space-y-2">
          {data.logic_steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {data.example_walkthrough && (
          <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Walkthrough: </span>
            {data.example_walkthrough}
          </div>
        )}
      </div>

      {/* Skeleton code */}
      <div className="rounded-xl border border-border/60 bg-zinc-950 text-zinc-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">💻 Skeleton — fill it in</p>
        </div>
        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{data.skeleton_code}</pre>
      </div>
    </div>
  );
}
