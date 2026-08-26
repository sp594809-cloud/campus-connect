import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  BookOpen,
} from "lucide-react";
import {
  adjacentModules,
  extractLessons,
  fetchModuleMarkdown,
  getModule,
  loadProgress,
  markModuleDone,
  type ProgressMap,
} from "@/lib/pythonCourse";
import { SimpleMarkdown } from "@/lib/simpleMarkdown";

export default function CoursePythonModule() {
  const { moduleId = "" } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const meta = getModule(moduleId);
  const { prev, next } = adjacentModules(moduleId);

  const [md, setMd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());

  useEffect(() => {
    if (!meta) {
      setLoading(false);
      setError("Module not found.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMd(null);
    fetchModuleMarkdown(meta.file)
      .then((text) => {
        if (!cancelled) setMd(text);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || "Failed to load module.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [meta]);

  if (!meta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-muted-foreground">Module not found.</p>
        <button
          type="button"
          onClick={() => navigate("/course/python")}
          className="text-sm font-semibold underline"
        >
          Back to course
        </button>
      </div>
    );
  }

  const lessons = md ? extractLessons(md) : [];
  const isDone = !!progress[meta.id];

  const onMarkDone = () => {
    setProgress(markModuleDone(meta.id));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-3 py-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/course/python")}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold hover:bg-secondary transition-smooth"
            aria-label="Back to course overview"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Modules</span>
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className={`h-8 w-8 rounded-xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shrink-0 text-sm`}
            >
              {meta.icon}
            </span>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">
                Module {meta.id}: {meta.title}
              </h1>
              <p className="text-[11px] text-muted-foreground truncate">{meta.weeks}</p>
            </div>
          </div>
          {isDone && (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" aria-label="Completed" />
          )}
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-5">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading lesson content…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center space-y-3">
            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-semibold">Could not load this module</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {md && !loading && (
          <>
            {lessons.length > 0 && (
              <details className="mb-5 rounded-xl border border-border/60 bg-card p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Lesson list ({lessons.length})
                </summary>
                <ol className="mt-2 space-y-1 pl-4 list-decimal text-xs text-muted-foreground">
                  {lessons.map((l) => (
                    <li key={l.id}>
                      <span className="font-medium text-foreground/80">{l.id}</span> — {l.title}
                    </li>
                  ))}
                </ol>
              </details>
            )}

            <article className="pb-8">
              <SimpleMarkdown source={md} />
            </article>

            <div className="sticky bottom-0 -mx-4 border-t border-border/60 bg-background/95 backdrop-blur-md px-4 py-3 flex flex-wrap items-center gap-2">
              {!isDone ? (
                <button
                  type="button"
                  onClick={onMarkDone}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-sm font-semibold hover:bg-emerald-700 transition-smooth"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark complete
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </span>
              )}

              <div className="flex-1" />

              {prev && (
                <button
                  type="button"
                  onClick={() => navigate(`/course/python/${prev.id}`)}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-secondary transition-smooth"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {prev.title}
                </button>
              )}
              {next && (
                <button
                  type="button"
                  onClick={() => navigate(`/course/python/${next.id}`)}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90 transition-smooth"
                >
                  {next.title}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
