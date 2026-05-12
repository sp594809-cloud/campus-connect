import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Flame, Sparkles, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { avatarFor } from "@/hooks/useProfiles";
import type { ScoreRow } from "./types";

export const CandidateCard = ({ row, saved, onSave }: { row: ScoreRow; saved?: boolean; onSave?: () => void }) => (
  <Card className="overflow-hidden border-border/60 hover:shadow-elevated transition-smooth">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <img src={avatarFor({ avatar_url: row.avatar_url, name: row.name })} alt={row.name} className="h-12 w-12 rounded-xl object-cover" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to={`/passport/${row.username || row.id}`} className="font-semibold text-sm hover:underline truncate">{row.name}</Link>
            {row.verified && <BadgeCheck className="h-3.5 w-3.5 text-success" />}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{row.branch ?? "—"} · {row.college_name ?? row.year ?? "—"}</p>
        </div>
        <Button size="icon" variant={saved ? "default" : "ghost"} onClick={onSave}><Bookmark className="h-4 w-4" /></Button>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-soft text-accent font-semibold"><Sparkles className="h-3 w-3" /> {row.employability_score}</span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning font-semibold"><Flame className="h-3 w-3" /> {row.current_streak}d</span>
        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{row.karma_total} karma</span>
        <Badge variant="outline" className="text-[10px]">{row.placement_status}</Badge>
      </div>
      {!!row.skills?.length && (
        <div className="mt-2 flex flex-wrap gap-1">
          {row.skills.slice(0,4).map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
        </div>
      )}
    </CardContent>
  </Card>
);