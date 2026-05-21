import { Loader2, Sparkles, Lightbulb } from "lucide-react";
import { useTheoryExplain } from "@/lib/api/learn";
import { Mermaid } from "./Mermaid";
import { cn } from "@/lib/utils";

interface Props {
  subject: string;
  topic: string;
  question: string;
  options?: string[];
  className?: string;
}

export function TheoryExplainer({ subject, topic, question, options, className }: Props) {
  const { data, isLoading, isError, error } = useTheoryExplain({ subject, topic, question, options });

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-4 flex items-center gap-3", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Teacher is thinking how to explain this simply…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn("rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-400", className)}>
        Could not load the friendly explanation. {error instanceof Error ? error.message : ""} You can still try the question below.
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border/60 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-4 space-y-3", className)}>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Explain like I'm 2</p>
        {data.cached && <span className="text-[10px] text-muted-foreground ml-auto">cached</span>}
      </div>

      <div className="text-base leading-relaxed font-medium">
        {data.simple_explanation}
      </div>

      <div className="text-3xl tracking-widest select-none" aria-label="emoji visual">
        {data.emoji_visual}
      </div>

      <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 flex gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <span className="font-semibold text-yellow-700 dark:text-yellow-400">Imagine this: </span>
          {data.analogy}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Visual</p>
        <Mermaid chart={data.mermaid_diagram} />
      </div>
    </div>
  );
}
