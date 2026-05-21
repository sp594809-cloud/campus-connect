import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const TIERS = [
  { name: "Explorer", min: 0, max: 20, color: "from-sky-400 to-cyan-500" },
  { name: "Builder", min: 21, max: 50, color: "from-violet-500 to-indigo-500" },
  { name: "Pro", min: 51, max: 100, color: "from-amber-400 to-rose-500" },
  { name: "Elite", min: 101, max: 250, color: "from-fuchsia-500 to-pink-500" },
  { name: "Legend", min: 251, max: 1000, color: "from-emerald-400 to-teal-500" },
];

export const LevelBar = ({ karma }: { karma: number }) => {
  const idx = Math.max(0, TIERS.findIndex((t, i) => karma <= t.max || i === TIERS.length - 1));
  const tier = TIERS[idx];
  const next = TIERS[idx + 1];
  const range = tier.max - tier.min;
  const within = Math.max(0, Math.min(range, karma - tier.min));
  const pct = Math.round((within / range) * 100);
  const [animatedPct, setAnimatedPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-center justify-between mb-2 text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Level {idx + 1} · <span className="text-foreground">{tier.name}</span>
        </span>
        <span className="text-muted-foreground tabular-nums">
          {karma} XP {next ? `· ${next.min - karma} to ${next.name}` : "· Max tier"}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tier.color} shadow-soft`}
          style={{ width: `${animatedPct}%`, transition: "width 1100ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </div>
    </div>
  );
};