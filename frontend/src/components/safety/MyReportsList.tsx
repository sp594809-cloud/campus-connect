import { useEffect, useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ReportRow {
  id: string;
  content_type: string;
  reason: string;
  status: string;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewed: "bg-blue-100 text-blue-800",
  actioned: "bg-emerald-100 text-emerald-800",
  dismissed: "bg-muted text-muted-foreground",
};

export const MyReportsList = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("reports")
        .select("id, content_type, reason, status, created_at")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      setRows((data ?? []) as ReportRow[]);
    })();
  }, [user?.id]);

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Flag className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-sm">My reports</h3>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {!loading && rows.length === 0 && (
        <p className="text-xs text-muted-foreground">No reports filed.</p>
      )}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold capitalize truncate">{r.content_type} · {r.reason}</p>
              <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusStyles[r.status] ?? "bg-muted text-muted-foreground")}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};