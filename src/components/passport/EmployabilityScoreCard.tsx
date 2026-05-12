import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import type { EmployabilityScore } from "@/lib/employability";

const Row = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex items-center justify-between text-xs font-medium mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
    <Progress value={value} className="h-2" />
  </div>
);

export const EmployabilityScoreCard = ({ score }: { score: EmployabilityScore }) => (
  <Card className="overflow-hidden border-border/60">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <TrendingUp className="h-4 w-4 text-accent" /> Proof of Work Score
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="text-5xl font-bold bg-gradient-accent bg-clip-text text-transparent">{score.total}</div>
        <div className="text-sm text-muted-foreground pb-2">/ 100</div>
      </div>
      <div className="grid gap-3">
        <Row label="Consistency" value={score.consistency} />
        <Row label="Peer Contribution" value={score.peer} />
        <Row label="Technical Discipline" value={score.technical} />
        <Row label="Community Impact" value={score.community} />
      </div>
    </CardContent>
  </Card>
);