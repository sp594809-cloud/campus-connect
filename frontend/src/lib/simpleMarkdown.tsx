import { Fragment, type ReactNode } from "react";

/**
 * Minimal markdown → React renderer for course modules.
 * Supports: headings, paragraphs, bold/italic, inline code, fenced code,
 * lists, blockquotes, horizontal rules, links, basic tables.
 * No extra npm deps (uses existing stack only).
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}

function inlineFormat(text: string): ReactNode[] {
  // Split by inline code, bold, italic, links
  const parts: ReactNode[] = [];
  const re =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    const token = m[0];
    if (token.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] font-mono text-foreground"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*")) {
      parts.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("[")) {
      const lm = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) {
        parts.push(
          <a
            key={key++}
            href={lm[2]}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {lm[1]}
          </a>
        );
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function SimpleMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing fence
      nodes.push(
        <pre
          key={key++}
          className="my-3 overflow-x-auto rounded-xl border border-border/60 bg-zinc-950 p-4 text-[13px] leading-relaxed text-zinc-100"
        >
          <code className={lang ? `language-${lang}` : undefined}>
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="my-6 border-border/60" />);
      i++;
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      const content = inlineFormat(h[2]);
      const cls =
        level === 1
          ? "mt-2 mb-4 text-2xl font-bold tracking-tight"
          : level === 2
            ? "mt-8 mb-3 text-xl font-bold border-b border-border/40 pb-2"
            : level === 3
              ? "mt-6 mb-2 text-lg font-semibold"
              : "mt-4 mb-2 text-base font-semibold";
      const Tag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      nodes.push(
        <Tag key={key++} className={cls}>
          {content}
        </Tag>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      nodes.push(
        <blockquote
          key={key++}
          className="my-4 border-l-4 border-primary/50 bg-muted/40 py-2 pl-4 pr-3 text-sm italic text-muted-foreground rounded-r-lg"
        >
          {inlineFormat(quote.join(" "))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      nodes.push(
        <ul key={key++} className="my-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          {items.map((item, idx) => (
            <li key={idx}>{inlineFormat(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      nodes.push(
        <ol key={key++} className="my-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
          {items.map((item, idx) => (
            <li key={idx}>{inlineFormat(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Table (simple pipe rows)
    if (line.includes("|") && lines[i + 1]?.match(/^\s*\|?[-:\s|]+\|?\s*$/)) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        if (/^\s*\|?[-:\s|]+\|?\s*$/.test(lines[i])) {
          i++;
          continue;
        }
        const cells = lines[i]
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => !(idx === 0 && arr[0] === "") && !(idx === arr.length - 1 && arr[arr.length - 1] === ""));
        // Fix: split and trim empties from edges
        const parts = lines[i].split("|").map((c) => c.trim());
        if (parts[0] === "") parts.shift();
        if (parts[parts.length - 1] === "") parts.pop();
        rows.push(parts);
        i++;
      }
      if (rows.length) {
        const [header, ...body] = rows;
        nodes.push(
          <div key={key++} className="my-4 overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60">
                <tr>
                  {header.map((c, ci) => (
                    <th key={ci} className="px-3 py-2 font-semibold">
                      {inlineFormat(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="border-t border-border/40">
                    {row.map((c, ci) => (
                      <td key={ci} className="px-3 py-2 align-top">
                        {inlineFormat(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph (merge consecutive non-empty non-special lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trimStart().startsWith("```") &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].startsWith(">") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\*{3,}|-{3,}|_{3,})\s*$/.test(lines[i].trim())
    ) {
      para.push(lines[i]);
      i++;
    }
    nodes.push(
      <p key={key++} className="my-3 text-sm leading-relaxed text-foreground/90">
        {inlineFormat(para.join(" "))}
      </p>
    );
  }

  return <Fragment>{nodes}</Fragment>;
}

// silence unused helper if tree-shaken oddly
void escapeHtml;
