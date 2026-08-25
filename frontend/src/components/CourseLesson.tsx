import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  downloadUrl: string;
  cacheKey?: string;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export default function CourseLesson({ downloadUrl, cacheKey }: Props) {
  const key = cacheKey ?? `course_lesson:${downloadUrl}`;
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; text: string };
        if (Date.now() - parsed.ts < CACHE_TTL_MS) {
          setContent(parsed.text);
          setLoading(false);
        }
      }
    } catch (e) {
      // ignore JSON errors
    }

    if (!content) {
      setLoading(true);
      fetch(downloadUrl)
        .then((r) => {
          if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
          return r.text();
        })
        .then((text) => {
          if (!mounted) return;
          setContent(text);
          setLoading(false);
          try {
            localStorage.setItem(key, JSON.stringify({ ts: Date.now(), text }));
          } catch (e) {
            // ignore storage errors (quota, private mode)
          }
        })
        .catch((e) => {
          if (!mounted) return;
          setError(String(e));
          setLoading(false);
        });
    }

    return () => {
      mounted = false;
    };
  }, [downloadUrl, key]);

  if (loading) return <div className="p-4">Loading lesson…</div>;
  if (error) return <div className="p-4 text-red-600">Error loading lesson: {error}</div>;
  if (!content) return <div className="p-4">No content.</div>;

  return (
    <article className="prose max-w-none p-4">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}
