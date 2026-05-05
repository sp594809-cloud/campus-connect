import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_CATEGORIES } from "@/data/placement";
import { cn } from "@/lib/utils";

interface Row {
  id: string; company_name: string; company_category: string; role: string;
  outcome: string; overall_difficulty: string; interview_year: number;
  application_source: string; ctc_lpa: number | null;
}
interface Round { experience_id: string; round_number: number; round_type: string; difficulty: string; }

const InterviewCompare = () => {
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [rounds, setRounds] = useState<Record<string, Round[]>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("interview_experiences")
        .select("id,company_name,company_category,role,outcome,overall_difficulty,interview_year,application_source,ctc_lpa")
        .order("created_at", { ascending: false }).limit(80);
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  useEffect(() => {
    if (!picked.length) return;
    (async () => {
      const missing = picked.filter((id) => !rounds[id]);
      if (!missing.length) return;
      const { data } = await supabase.from("interview_rounds").select("experience_id,round_number,round_type,difficulty").in("experience_id", missing).order("round_number");
      const map: Record<string, Round[]> = { ...rounds };
      missing.forEach((id) => { map[id] = []; });
      (data ?? []).forEach((r: any) => { map[r.experience_id] = [...(map[r.experience_id] ?? []), r]; });
      setRounds(map);
    })();
  }, [picked]);

  const filtered = useMemo(() => rows.filter((r) =>
    !q.trim() || r.company_name.toLowerCase().includes(q.toLowerCase()) || r.role.toLowerCase().includes(q.toLowerCase())
  ), [rows, q]);

  const toggle = (id: string) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]);
  const selected = picked.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as Row[];

  const diffMap: Record<string, string> = { easy: "bg-success/15 text-success", medium: "bg-amber-100 text-amber-800", hard: "bg-destructive/15 text-destructive" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
      <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-elevated pb-10">
        <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
          <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
          <h1 className="font-bold text-base ml-1">Compare ({picked.length}/3)</h1>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pick experiences to compare…" className="w-full pl-9 pr-4 py-2.5 rounded-full bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filtered.map((r) => {
              const on = picked.includes(r.id);
              const cat = COMPANY_CATEGORIES.find((c) => c.id === r.company_category);
              return (
                <button key={r.id} onClick={() => toggle(r.id)} className={cn("w-full text-left flex items-center gap-3 p-3 rounded-2xl border transition-smooth", on ? "border-primary bg-accent-soft" : "border-border bg-card")}>
                  <span className="text-xl">{cat?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{r.company_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{r.role} · {r.interview_year}</p>
                  </div>
                  {on && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-xs border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="text-left text-muted-foreground font-semibold p-2"></th>
                    {selected.map((s) => (
                      <th key={s.id} className="p-2 align-top min-w-[120px]">
                        <div className="rounded-xl bg-card border border-border p-2 relative">
                          <button onClick={() => toggle(s.id)} className="absolute top-1 right-1"><X className="h-3 w-3" /></button>
                          <p className="font-bold truncate text-left">{s.company_name}</p>
                          <p className="text-[10px] text-muted-foreground text-left">{s.role}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Cmp label="Outcome" cells={selected.map((s) => s.outcome)} />
                  <Cmp label="Year" cells={selected.map((s) => String(s.interview_year))} />
                  <Cmp label="Source" cells={selected.map((s) => s.application_source.replace("_", " "))} />
                  <Cmp label="CTC (LPA)" cells={selected.map((s) => s.ctc_lpa ? String(s.ctc_lpa) : "—")} />
                  <Cmp label="Difficulty" cells={selected.map((s) => s.overall_difficulty)} />
                  <Cmp label="# Rounds" cells={selected.map((s) => String(rounds[s.id]?.length ?? "…"))} />
                  <tr>
                    <td className="p-2 text-left font-semibold text-muted-foreground align-top">Round mix</td>
                    {selected.map((s) => (
                      <td key={s.id} className="p-2 align-top">
                        <div className="space-y-1">
                          {(rounds[s.id] ?? []).map((r) => (
                            <div key={r.round_number} className={cn("px-2 py-1 rounded-lg text-[10px] font-semibold", diffMap[r.difficulty])}>
                              R{r.round_number}: {r.round_type}
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Cmp = ({ label, cells }: { label: string; cells: string[] }) => (
  <tr>
    <td className="p-2 text-left font-semibold text-muted-foreground">{label}</td>
    {cells.map((c, i) => <td key={i} className="p-2 capitalize font-semibold">{c}</td>)}
  </tr>
);

export default InterviewCompare;