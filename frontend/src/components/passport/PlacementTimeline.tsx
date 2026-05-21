import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MessageSquare, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  kind: "interview" | "post";
  tag?: string;
}

export const PlacementTimeline = ({ items }: { items: TimelineItem[] }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Briefcase className="h-4 w-4 text-accent" /> Placement Timeline
      </CardTitle>
    </CardHeader>
    <CardContent>
      {!items.length ? (
        <p className="text-xs text-muted-foreground text-center py-6">No placement activity to show yet.</p>
      ) : (
        <ol className="relative border-l border-border ml-2 space-y-5">
          {items.map((it) => (
            <li key={it.id} className="ml-4">
              <div className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-gradient-accent shadow-glow" />
              <div className="flex items-center gap-2 flex-wrap">
                {it.kind === "interview" ? <Briefcase className="h-3.5 w-3.5 text-accent" /> : <MessageSquare className="h-3.5 w-3.5 text-primary" />}
                <p className="text-sm font-semibold">{it.title}</p>
                {it.tag && <Badge variant="secondary" className="text-[10px]">{it.tag}</Badge>}
              </div>
              {it.subtitle && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{it.subtitle}</p>}
              <time className="text-[11px] text-muted-foreground">{new Date(it.date).toLocaleDateString()}</time>
            </li>
          ))}
        </ol>
      )}
    </CardContent>
  </Card>
);