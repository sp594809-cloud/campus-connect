import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { EmployabilityScore } from "@/lib/employability";

const Ring = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  const offset = c - (animated / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <div className="relative h-16 w-16 transition-transform duration-300 group-hover:scale-110">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r={r} className="fill-none stroke-muted" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={r}
            className="fill-none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{value}</div>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
};

export const EmployabilityScoreCard = ({ score }: { score: EmployabilityScore }) => (
  <Card className="overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <TrendingUp className="h-4 w-4 text-accent" /> Proof of Work Score
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="text-5xl font-bold bg-gradient-accent bg-clip-text text-transparent animate-fade-in">{score.total}</div>
        <div className="text-sm text-muted-foreground pb-2">/ 100</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Ring label="Consistency" value={score.consistency} color="hsl(var(--success))" />
        <Ring label="Peer" value={score.peer} color="hsl(var(--primary))" />
        <Ring label="Technical" value={score.technical} color="hsl(var(--accent))" />
        <Ring label="Community" value={score.community} color="hsl(var(--warning))" />
      </div>
    </CardContent>
  </Card>
);