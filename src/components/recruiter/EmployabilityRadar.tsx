import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import type { EmployabilityScore } from "@/lib/employability";

export const EmployabilityRadar = ({ score }: { score: EmployabilityScore }) => {
  const data = [
    { axis: "Consistency", v: score.consistency },
    { axis: "Peer", v: score.peer },
    { axis: "Technical", v: score.technical },
    { axis: "Community", v: score.community },
  ];
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Employability Radar</CardTitle></CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer>
            <RadarChart data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
              <Radar dataKey="v" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};