import { useEffect, useMemo, useState } from "react";
import mermaid from "mermaid";
import DOMPurify from "dompurify";

let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "default",
    fontFamily: "inherit",
    flowchart: { htmlLabels: false, curve: "basis" },
  });
  initialized = true;
}

// Configure a single DOMPurify instance allowing SVG output but stripping
// any executable content (script, foreignObject with handlers, on* attrs, etc.).
const purifyConfig: DOMPurify.Config = {
  USE_PROFILES: { svg: true, svgFilters: true },
  // Mermaid emits class/style attributes; allow them but forbid event handlers.
  FORBID_TAGS: ["script", "foreignObject"],
  FORBID_ATTR: [
    "onclick",
    "onerror",
    "onload",
    "onmouseover",
    "onmouseout",
    "onmousemove",
    "onfocus",
    "onblur",
    "onchange",
    "onsubmit",
    "onkeydown",
    "onkeyup",
    "onkeypress",
  ],
  KEEP_CONTENT: true,
};

export function Mermaid({ chart, className = "" }: { chart: string; className?: string }) {
  const [svg, setSvg] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  // Pre-validate input shape so we don't pass arbitrary text to mermaid.render.
  const safeChart = useMemo(() => {
    if (typeof chart !== "string") return "";
    const trimmed = chart.trim();
    if (!trimmed) return "";
    // Mermaid diagrams start with a known keyword on the first line.
    const firstLine = trimmed.split(/\r?\n/)[0]!.trim().toLowerCase();
    const allowed = [
      "graph",
      "flowchart",
      "sequencediagram",
      "classdiagram",
      "statediagram",
      "erdiagram",
      "journey",
      "gantt",
      "pie",
      "mindmap",
      "timeline",
      "quadrantchart",
    ];
    return allowed.some((kw) => firstLine.startsWith(kw)) ? trimmed : "";
  }, [chart]);

  useEffect(() => {
    ensureInit();
    let cancelled = false;
    const id = `mmd-${Math.random().toString(36).slice(2, 10)}`;
    (async () => {
      if (!safeChart) {
        setSvg("");
        setErr(null);
        return;
      }
      try {
        const result = await mermaid.render(id, safeChart);
        if (cancelled) return;
        // Sanitize before injecting.
        const cleaned = DOMPurify.sanitize(result.svg, purifyConfig);
        setSvg(cleaned);
        setErr(null);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [safeChart]);

  if (err || !svg) {
    return (
      <div className={`text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 ${className}`}>
        <div className="opacity-70">(diagram unavailable)</div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto rounded-lg bg-white dark:bg-zinc-900/60 p-3 border border-border/60 [&_svg]:max-w-full [&_svg]:h-auto ${className}`}
      // svg is sanitized by DOMPurify above; SVG profile strips scripts and on* handlers.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
