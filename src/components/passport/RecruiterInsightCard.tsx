import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export const RecruiterInsightCard = ({ insights }: { insights: string[] }) => (
  <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Lightbulb className="h-4 w-4 text-warning" /> Consistency Insights
      </CardTitle>
    </CardHeader>
    <CardContent>
      {insights.length === 0 ? (
        <p className="text-xs text-muted-foreground">Not enough activity to surface insights yet.</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((s, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);