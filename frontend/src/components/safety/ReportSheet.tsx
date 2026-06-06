import { useState } from "react";
import { Flag, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ReportContentType = "post" | "message" | "community_message" | "listing";

const REASONS: { id: "harassment" | "inappropriate" | "misinformation" | "scam" | "other"; label: string }[] = [
  { id: "harassment", label: "Harassment" },
  { id: "inappropriate", label: "Inappropriate" },
  { id: "misinformation", label: "Misinformation" },
  { id: "scam", label: "Scam" },
  { id: "other", label: "Other" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  contentType: ReportContentType;
  contentId: string;
  reportedUserId?: string | null;
}

const LABEL: Record<ReportContentType, string> = {
  post: "post",
  message: "message",
  community_message: "message",
  listing: "listing",
};

export const ReportSheet = ({ open, onClose, contentType, contentId, reportedUserId }: Props) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<typeof REASONS[number]["id"] | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!user) { toast.error("Sign in to report"); return; }
    if (!reason) { toast.error("Pick a reason"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reports" as never).insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId ?? null,
      content_type: contentType,
      content_id: contentId,
      reason,
      details: details.trim() || null,
    } as never);
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast.message("Already reported", { description: "You've already reported this. College admins will review it." });
        onClose();
        return;
      }
      toast.error(error.message);
      return;
    }
    toast.success("Report submitted", { description: "College admins will review this shortly." });
    setReason(null);
    setDetails("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-5 space-y-4 shadow-elevated animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"><Flag className="h-4 w-4" /></div>
            <div>
              <h3 className="font-bold text-sm">Report this {LABEL[contentType]}</h3>
              <p className="text-[11px] text-muted-foreground">Sent to college administration for review</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Reason</p>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setReason(r.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth",
                  reason === r.id ? "bg-destructive text-destructive-foreground shadow-soft" : "bg-secondary text-secondary-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Additional context (optional)</p>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Anything college admins should know…"
            className="w-full px-3 py-2 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">{details.length}/500</p>
        </div>

        <button
          onClick={submit}
          disabled={!reason || submitting}
          className="w-full py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </div>
    </div>
  );
};