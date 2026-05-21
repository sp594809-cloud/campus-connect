import { Brain, ChevronRight, CheckCircle, Code2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBJECTS, type SubjectMeta } from '@/data/preparation/subjects';

// Re-export Subject type for backwards-compatibility with existing files.
export type Subject = {
  id: string;
  name: string;
  icon: typeof Brain;
  color: string;
  topicsCount: number;
  completedTopics: number;
  mode?: 'coding' | 'theory';
};

interface SubjectSelectionProps {
  completedMap?: Record<string, number>;
  onSelectSubject: (subjectId: string) => void;
}

export function SubjectSelection({ completedMap = {}, onSelectSubject }: SubjectSelectionProps) {
  const subjects = SUBJECTS.map((s: SubjectMeta) => ({
    ...s,
    completedTopics: completedMap[s.id] || 0,
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="mb-2">
        <h2 className="text-2xl font-bold">Choose Subject</h2>
        <p className="text-sm text-muted-foreground">
          Pick a subject — AI will teach the topic first, then test you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {subjects.map((subject) => {
          const progress = subject.topicsCount > 0
            ? (subject.completedTopics / subject.topicsCount) * 100
            : 0;
          const isCompleted = subject.completedTopics === subject.topicsCount && subject.topicsCount > 0;
          const coding = subject.mode === 'coding';

          return (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              className={cn(
                "relative p-4 rounded-2xl border transition-all duration-200 text-left overflow-hidden",
                "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50",
                isCompleted
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-card border-border"
              )}
            >
              {/* Mode badge */}
              <div className={cn(
                "absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                coding ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
              )}>
                {coding ? <Code2 className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
                {coding ? "Code" : "Theory"}
              </div>

              <subject.icon className={cn("w-8 h-8 mb-2", subject.color)} />

              <div className="font-semibold leading-tight">{subject.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{subject.description}</div>

              <div className="text-xs text-muted-foreground mt-2">
                {subject.completedTopics}/{subject.topicsCount} topics
              </div>

              {progress > 0 && (
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isCompleted ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {isCompleted && (
                <CheckCircle className="absolute bottom-2 right-2 w-5 h-5 text-green-500" />
              )}

              {!isCompleted && (
                <ChevronRight className="absolute bottom-2 right-2 w-4 h-4 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
