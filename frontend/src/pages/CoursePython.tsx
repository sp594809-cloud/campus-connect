import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, Circle } from "lucide-react";
import {
  PYTHON_MODULES,
  completedCount,
  loadProgress,
  type ProgressMap,
} from "@/lib/pythonCourse";

/**
 * Native Python Mastery course — lives inside Campus Connect.
 * Content is loaded from the python repo; progress is stored locally.
 */
export default function CoursePython() {
  const navigate = useNavigate();
  const [progress] = useState<ProgressMap>(() => loadProgress());
  const done = useMemo(() => completedCount(progress), [progress]);
  const total = PYTHON_MODULES.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-3 py-2.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/campus")}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-secondary transition-smooth"
            aria-label="Back to Campus"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Campus</span>
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="h-8 w-8 rounded-xl bg-gradient-hero text-white flex items-center justify-center shrink-0 shadow-soft">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">Python Mastery</h1>
              <p className="text-[11px] text-muted-foreground truncate">
                10 modules · from zero to professional
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-sm font-semibold">Your progress</p>
            <p className="text-xs text-muted-foreground">
              {done}/{total} modules · {pct}%
            </p>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            Lessons load from the course content library. Mark a module complete when you finish it — progress is saved on this device.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide px-1">
            Modules
          </h2>
          <ul className="space-y-2.5">
            {PYTHON_MODULES.map((mod) => {
              const isDone = !!progress[mod.id];
              return (
                <li key={mod.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/course/python/${mod.id}`)}
                    className="w-full text-left rounded-2xl border border-border/60 bg-card p-3.5 hover:border-primary/40 hover:shadow-soft transition-smooth flex gap-3 items-start"
                  >
                    <span
                      className={`h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br ${mod.gradient} text-white flex items-center justify-center text-lg shadow-soft`}
                    >
                      {mod.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Module {mod.id}
                        </span>
                        <span className="text-[11px] text-muted-foreground">· {mod.weeks}</span>
                      </div>
                      <p className="font-bold text-sm mt-0.5">{mod.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                        {mod.topics.join(" · ")}
                      </p>
                    </div>
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-1" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
