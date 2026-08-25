import { useEffect, useState } from "react";
import CourseLesson from "@/components/CourseLesson";

type FileItem = {
  name: string;
  path: string;
  download_url?: string | null;
};

const OWNER = "sp594809-cloud"; // update if your python repo is under a different owner
const REPO = "python"; // repo name
const CANDIDATE_DIRS = ["course", "lessons", "docs", ""];

export default function CoursePython() {
  const [files, setFiles] = useState<FileItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FileItem | null>(null);

  useEffect(() => {
    let alive = true;

    async function findAndList() {
      setLoading(true);
      for (const dir of CANDIDATE_DIRS) {
        const path = dir ? `/${dir}` : "";
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents${path}`;
        try {
          const r = await fetch(url);
          if (!r.ok) {
            // try next
            continue;
          }
          const j = await r.json();
          if (!Array.isArray(j)) continue;
          const mdFiles = (j as any[])
            .filter((f) => f.type === "file" && /\.md$/i.test(f.name))
            .map((f) => ({ name: f.name, path: f.path, download_url: f.download_url } as FileItem));
          if (mdFiles.length) {
            if (!alive) return;
            setFiles(mdFiles);
            setSelected(mdFiles[0]);
            setLoading(false);
            return;
          }
        } catch (e) {
          // continue to next
          continue;
        }
      }
      if (!alive) return;
      setError("Could not find markdown lessons in the python repo (looked in course/, lessons/, docs/)");
      setLoading(false);
    }

    findAndList();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="p-4">Loading course…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!files || files.length === 0) return <div className="p-4">No lessons found.</div>;

  return (
    <div className="min-h-screen bg-background/0 p-4">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Python Course</h1>
          <a className="text-sm text-muted-foreground underline" href={`https://github.com/${OWNER}/${REPO}`} target="_blank" rel="noreferrer">View source</a>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <aside className="col-span-1 bg-card rounded-md p-3">
            <h2 className="font-semibold mb-2">Lessons</h2>
            <ul className="flex flex-col gap-1">
              {files.map((f) => (
                <li key={f.path}>
                  <button
                    onClick={() => setSelected(f)}
                    className={`text-left w-full p-2 rounded-md hover:bg-accent/10 transition ${selected?.path === f.path ? "bg-accent/20 font-semibold" : ""}`}
                  >
                    {f.name.replace(/\.md$/i, "")}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <main className="col-span-2 bg-card rounded-md p-0 overflow-hidden">
            {selected ? (
              <CourseLesson downloadUrl={selected.download_url ?? `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${selected.path}`} cacheKey={`python:${selected.path}`} />
            ) : (
              <div className="p-4">Select a lesson</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
