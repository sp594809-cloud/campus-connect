import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, BookOpen } from "lucide-react";

/** Deployed Python Mastery Course (Flask app from sp594809-cloud/python) */
const DEPLOYED_COURSE_URL = "https://python-41vy.onrender.com";
const GITHUB_COURSE_URL = "https://github.com/sp594809-cloud/python";

/**
 * Python Course page — embeds the full course from the python repo / Render deploy.
 * Students reach this via the "Courses" button in Campus Connect.
 */
export default function CoursePython() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header with back to campus */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-3 py-2.5 flex items-center gap-3">
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
              <h1 className="text-sm font-bold truncate">Python Course</h1>
              <p className="text-[11px] text-muted-foreground truncate">From zero to professional</p>
            </div>
          </div>

          <a
            href={DEPLOYED_COURSE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
            title="Open full course in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
          <a
            href={GITHUB_COURSE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground underline underline-offset-2 hidden md:inline"
          >
            Source
          </a>
        </div>
      </header>

      {/* Full course app embedded from Render */}
      <main className="flex-1 relative">
        <iframe
          src={DEPLOYED_COURSE_URL}
          title="Python Mastery Course"
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
          allow="clipboard-read; clipboard-write"
        />
      </main>

      {/* Fallback note if iframe is blocked or Render is cold-starting */}
      <noscript>
        <div className="p-6 text-center">
          <p className="mb-2">JavaScript is required to view the course in-app.</p>
          <a className="underline font-semibold" href={DEPLOYED_COURSE_URL}>
            Open Python Course
          </a>
        </div>
      </noscript>
    </div>
  );
}
