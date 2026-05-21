import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel",
  destructive = true, busy = false, onConfirm, onCancel,
}: Props) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[200] bg-foreground/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onCancel}
    >
      <div
        className="glass-card rounded-3xl p-5 w-full max-w-sm shadow-elevated animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
            destructive ? "bg-destructive/15 text-destructive glow-danger" : "bg-primary/15 text-primary"
          )}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-title" className="font-bold text-base text-foreground">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <button onClick={onCancel} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary/60 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 rounded-2xl border border-border bg-background/40 text-sm font-semibold hover:bg-secondary/60 transition-smooth disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-smooth disabled:opacity-50",
              destructive ? "bg-destructive glow-danger hover:brightness-110" : "bg-gradient-cta shadow-glow"
            )}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
