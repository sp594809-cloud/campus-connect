import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";

interface Props {
  completions: { completed_on: string }[];
  streak: { current_streak: number; longest_streak: number; total_completed: number; last_completed_date: string | null } | null;
}

export const StreakCalendar = ({ completions, streak }: Props) => {
  const grid = useMemo(() => {
    const days = 84; // ~12 weeks
    const set = new Set(completions.map((c) => c.completed_on));
    const today = new Date(); today.setHours(0,0,0,0);
    const cells: { date: string; done: boolean }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0,10);
      cells.push({ date: key, done: set.has(key) });
    }
    return cells;
  }, [completions]);

  const cur = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const total = streak?.total_completed ?? 0;
  const active = cur > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className={`h-4 w-4 ${active ? "text-warning animate-pulse" : "text-muted-foreground"}`} />
          DSA Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-xs text-muted-foreground">Current</div>
            <div className="text-2xl font-bold flex items-center gap-1">{cur}<Flame className={`h-4 w-4 ${active ? "text-warning" : "text-muted-foreground"}`} /></div>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-xs text-muted-foreground">Longest</div>
            <div className="text-2xl font-bold flex items-center gap-1">{longest}<Trophy className="h-4 w-4 text-accent" /></div>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-2xl font-bold flex items-center gap-1">{total}<CheckCircle2 className="h-4 w-4 text-success" /></div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-[3px]">
          {grid.map((c) => (
            <div
              key={c.date}
              title={c.date}
              className={`h-4 rounded-sm ${c.done ? "bg-success" : "bg-muted"}`}
            />
          ))}
        </div>
        {!completions.length && <p className="text-xs text-muted-foreground mt-3 text-center">No DSA activity yet.</p>}
      </CardContent>
    </Card>
  );
};