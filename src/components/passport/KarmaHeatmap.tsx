import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity } from "lucide-react";
import { CATEGORY_COLOR, KARMA_CATEGORY } from "@/lib/employability";
import { useMemo } from "react";

interface KarmaEvent { action: string; points: number; created_at: string }

export const KarmaHeatmap = ({ events }: { events: KarmaEvent[] }) => {
  const { weeks, categories, total } = useMemo(() => {
    const days = 365;
    const map = new Map<string, { points: number; topCat: string; cats: Record<string, number> }>();
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < days; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0,10);
      map.set(key, { points: 0, topCat: "", cats: {} });
    }
    let total = 0;
    const catSet = new Set<string>();
    for (const e of events) {
      const key = (e.created_at ?? "").slice(0,10);
      const slot = map.get(key);
      if (!slot) continue;
      const cat = KARMA_CATEGORY(e.action);
      catSet.add(cat);
      slot.cats[cat] = (slot.cats[cat] ?? 0) + e.points;
      slot.points += e.points;
      total += e.points;
    }
    for (const v of map.values()) {
      v.topCat = Object.entries(v.cats).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? "";
    }
    // Build weeks (col=week, row=day-of-week)
    const sorted = Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
    const start = new Date(sorted[0][0]);
    const startDow = start.getDay();
    const cells: { date: string; points: number; topCat: string }[] = [];
    for (let i = 0; i < startDow; i++) cells.push({ date: "", points: 0, topCat: "" });
    for (const [date, v] of sorted) cells.push({ date, points: v.points, topCat: v.topCat });
    const weeks: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i+7));
    return { weeks, categories: Array.from(catSet), total };
  }, [events]);

  const intensity = (p: number) => {
    if (!p) return 0.07;
    if (p < 5) return 0.25;
    if (p < 15) return 0.45;
    if (p < 40) return 0.7;
    return 1;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> Karma Activity</span>
          <span className="text-xs font-normal text-muted-foreground">{total} pts · last 365d</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={50}>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-[3px]">
              {weeks.map((w, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {w.map((c, ci) => {
                    if (!c.date) return <div key={ci} className="h-[11px] w-[11px]" />;
                    const color = c.topCat ? CATEGORY_COLOR[c.topCat] ?? "hsl(var(--accent))" : "hsl(var(--muted))";
                    return (
                      <Tooltip key={ci}>
                        <TooltipTrigger asChild>
                          <div className="h-[11px] w-[11px] rounded-[2px] transition-smooth" style={{ background: color, opacity: intensity(c.points) }} />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {c.points} pts · {c.date}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>
        {!!categories.length && (
          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map(c => (
              <div key={c} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CATEGORY_COLOR[c] }} />
                {c.replace(/_/g," ")}
              </div>
            ))}
          </div>
        )}
        {!events.length && (
          <p className="text-xs text-muted-foreground mt-3 text-center">No karma activity yet.</p>
        )}
      </CardContent>
    </Card>
  );
};