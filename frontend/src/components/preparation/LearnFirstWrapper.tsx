import { useState, useEffect } from "react";
import { BookOpen, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { isCoding } from "@/data/preparation/subjects";
import { TheoryExplainer } from "./TheoryExplainer";
import { CodingExplainer } from "./CodingExplainer";

interface Props {
  subjectId: string;
  topic: string;
  question: string;
  options?: string[];
  defaultOpen?: boolean;
  resetKey?: string;
}

export function LearnFirstWrapper({
  subjectId,
  topic,
  question,
  options,
  defaultOpen = true,
  resetKey,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const coding = isCoding(subjectId);

  // Re-open whenever question changes
  useEffect(() => {
    setOpen(defaultOpen);
  }, [resetKey, defaultOpen]);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/60 bg-gradient-to-r transition-colors",
          coding
            ? "from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/15 hover:to-cyan-500/15"
            : "from-blue-500/10 to-purple-500/10 hover:from-blue-500/15 hover:to-purple-500/15"
        )}
      >
        <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0", coding ? "bg-emerald-500/20" : "bg-primary/15")}>
          {coding ? <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <GraduationCap className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold">
            {coding ? "🎯 See Expected Output First" : "📖 Learn This Topic"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {coding ? "AI shows you what your code should produce, then explains the logic" : "AI explains this in the simplest way — like to a 2-year-old"}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-3">
          {coding ? (
            <CodingExplainer subject={subjectId} topic={topic} question={question} />
          ) : (
            <TheoryExplainer subject={subjectId} topic={topic} question={question} options={options} />
          )}
        </div>
      )}
    </div>
  );
}
