import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { ScoreRow } from "./types";

export type SortKey = "employability_score" | "karma_total" | "current_streak" | "longest_streak";

export const RecruiterLeaderboard = ({
  rows, sortKey, onSort,
}: { rows: ScoreRow[]; sortKey: SortKey; onSort: (k: SortKey) => void }) => {
  const Sortable = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={()=>onSort(k)} className="flex items-center gap-1 font-semibold hover:text-foreground">
      {label} <ArrowUpDown className={`h-3 w-3 ${sortKey===k ? "text-accent" : "opacity-50"}`} />
    </button>
  );
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>College</TableHead>
            <TableHead><Sortable k="karma_total" label="Karma" /></TableHead>
            <TableHead><Sortable k="current_streak" label="Streak" /></TableHead>
            <TableHead><Sortable k="longest_streak" label="Best" /></TableHead>
            <TableHead>Placement</TableHead>
            <TableHead><Sortable k="employability_score" label="Score" /></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={r.id}>
              <TableCell className="text-muted-foreground text-xs">{i+1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 min-w-[140px]">
                  <Link to={`/recruiter/student/${r.id}`} className="font-medium hover:underline">{r.name}</Link>
                  {r.verified && <BadgeCheck className="h-3.5 w-3.5 text-success" />}
                </div>
                {!!r.skills?.length && <div className="flex gap-1 mt-0.5">{r.skills.slice(0,3).map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div>}
              </TableCell>
              <TableCell className="text-xs">{r.branch ?? "—"}</TableCell>
              <TableCell className="text-xs truncate max-w-[140px]">{r.college_name ?? "—"}</TableCell>
              <TableCell className="text-sm font-semibold">{r.karma_total}</TableCell>
              <TableCell className="text-sm">{r.current_streak}</TableCell>
              <TableCell className="text-sm">{r.longest_streak}</TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{r.placement_status}</Badge></TableCell>
              <TableCell><span className="font-bold text-accent">{r.employability_score}</span></TableCell>
              <TableCell><Button size="sm" variant="ghost" asChild><Link to={`/recruiter/student/${r.id}`}>View</Link></Button></TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-10">No candidates match your filters.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};