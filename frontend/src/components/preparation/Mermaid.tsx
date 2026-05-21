import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default",
    fontFamily: "inherit",
    flowchart: { htmlLabels: true, curve: "basis" },
  });
  initialized = true;
}

export function Mermaid({ chart, className = "" }: { chart: string; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [svg, setSvg] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    ensureInit();
    let cancelled = false;
    const id = `mmd-${Math.random().toString(36).slice(2, 10)}`;
    (async () => {
      try {
        const cleaned = (chart || "").trim();
        if (!cleaned) {
          setSvg("");
          return;
        }
        const { svg } = await mermaid.render(id, cleaned);
        if (!cancelled) {
          setSvg(svg);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (err) {
    return (
      <div className={`text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 ${className}`}>
        <div className="opacity-70">(diagram could not render)</div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`overflow-x-auto rounded-lg bg-white dark:bg-zinc-900/60 p-3 border border-border/60 [&_svg]:max-w-full [&_svg]:h-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
