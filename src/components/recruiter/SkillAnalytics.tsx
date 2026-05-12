import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import type { ScoreRow } from "./types";

export const SkillAnalytics = ({ rows }: { rows: ScoreRow[] }) => {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) for (const s of (r.skills ?? [])) counts.set(s, (counts.get(s) ?? 0) + 1);
    return Array.from(counts.entries()).map(([skill,count])=>({ skill, count })).sort((a,b)=>b.count-a.count).slice(0, 10);
  }, [rows]);

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Top Skills</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? <p className="text-xs text-muted-foreground">No skills data.</p> : (
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="skill" type="category" width={90} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};