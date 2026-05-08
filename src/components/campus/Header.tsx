import { Bell, Check, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useConnections } from "@/hooks/useConnections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfilesByIds, type MiniProfile } from "@/lib/api/profiles";

export const Header = ({
  title,
  subtitle,
  showSearch,
  onSearchClick,
}: {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
}) => {
  const { pendingIncoming, reload } = useConnections();
  const [open, setOpen] = useState(false);
  const ids = useMemo(() => pendingIncoming.map((r) => r.requester_id), [pendingIncoming]);
  const { data: senderList } = useProfilesByIds(ids);
  const senders = useMemo<Record<string, MiniProfile>>(() => {
    const map: Record<string, MiniProfile> = {};
    (senderList ?? []).forEach((p) => { map[p.id] = p; });
    return map;
  }, [senderList]);

  const respond = async (id: string, status: "accepted" | "declined") => {
    const { error } = await supabase.from("connection_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "accepted" ? "Connected! You can chat now." : "Request declined");
    reload();
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-5 pt-6 pb-3 border-b border-border/60">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {showSearch && (
            <button onClick={onSearchClick} aria-label="Search" className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-muted transition-smooth">
              <Search className="h-5 w-5" />
            </button>
          )}
          <button onClick={() => setOpen(true)} aria-label="Notifications" className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center relative hover:bg-muted transition-smooth">
            <Bell className="h-5 w-5" />
            {pendingIncoming.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center">{pendingIncoming.length}</span>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-start justify-center p-4 pt-16 animate-fade-in-up" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-3xl w-full max-w-md shadow-elevated animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold">Notifications</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {pendingIncoming.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <p className="text-3xl mb-2">🔔</p>
                  No new requests
                </div>
              )}
              {pendingIncoming.map((r) => {
                const s = senders[r.requester_id];
                return (
                  <div key={r.id} className="p-4 border-b border-border/60 flex gap-3">
                    <img src={s?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s?.name ?? "?")}`} alt="" className="h-11 w-11 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm"><span className="font-bold">{s?.name ?? "Someone"}</span> wants to connect</p>
                      <p className="text-[11px] text-muted-foreground">{s?.branch} · {s?.year} year</p>
                      {r.message && <p className="text-xs mt-1.5 p-2 rounded-xl bg-secondary">{r.message}</p>}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => respond(r.id, "accepted")} className="flex-1 bg-gradient-hero text-primary-foreground text-xs font-bold py-2 rounded-full flex items-center justify-center gap-1"><Check className="h-3.5 w-3.5" /> Accept</button>
                        <button onClick={() => respond(r.id, "declined")} className="flex-1 bg-secondary text-secondary-foreground text-xs font-bold py-2 rounded-full">Decline</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};