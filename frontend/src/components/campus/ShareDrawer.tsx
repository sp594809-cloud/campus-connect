import { useEffect, useState } from "react";
import { Copy, Link2, MessageCircle, Send, Share2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avatarFor } from "@/hooks/useProfiles";
import { fetchProfilesByIds, type MiniProfile } from "@/lib/api/profiles";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  preview?: string;
}

export const ShareDrawer = ({ open, onClose, title, url, preview }: Props) => {
  const { user } = useAuth();
  const [recents, setRecents] = useState<MiniProfile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("user_a,user_b,last_message_at")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(12);
      if (error || !data) return;
      const otherIds = (data as { user_a: string; user_b: string }[])
        .map((c) => (c.user_a === user.id ? c.user_b : c.user_a));
      if (!otherIds.length) { if (alive) setRecents([]); return; }
      const profiles = await fetchProfilesByIds(otherIds);
      if (!alive) return;
      const map = new Map(profiles.map((p) => [p.id, p]));
      setRecents(otherIds.map((id) => map.get(id)).filter(Boolean) as MiniProfile[]);
    })().catch((err) => console.error("[ShareDrawer] recents", err));
    return () => { alive = false; };
  }, [open, user]);

  if (!open) return null;

  const shareText = `${title}\n${preview ? preview + "\n" : ""}${url}`;

  const sendDM = async (toId: string) => {
    if (!user) return;
    setBusy(toId);
    const { data: convId, error } = await supabase.rpc("get_or_create_conversation", { other_user: toId });
    if (error || !convId) { setBusy(null); toast.error(error?.message ?? "Cannot start chat"); return; }
    const { error: mErr } = await supabase.from("messages").insert({
      conversation_id: convId as unknown as string,
      sender_id: user.id,
      content: shareText,
    });
    setBusy(null);
    if (mErr) { toast.error(mErr.message); return; }
    toast.success("Shared in chat", { style: { background: "hsl(152 68% 38%)", color: "white" } });
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    catch { toast.error("Copy failed"); }
  };
  const native = async () => {
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (!nav.share) { copy(); return; }
    try { await nav.share({ title, text: preview ?? title, url }); }
    catch { /* dismissed */ }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share"
      className="fixed inset-0 z-[200] bg-foreground/40 backdrop-blur-[16px] flex items-end justify-center animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-md rounded-t-3xl p-5 pb-7 shadow-elevated animate-fade-in-up"
        style={{ backdropFilter: "blur(16px) saturate(160%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-foreground/15 mb-4" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-cta text-white flex items-center justify-center shadow-glow">
              <Share2 className="h-4 w-4" />
            </div>
            <h3 className="font-bold">Share</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary/60 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Recent chats */}
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent chats</p>
        {recents.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">Start a chat with classmates to share posts directly.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {recents.map((p) => (
              <button
                key={p.id}
                onClick={() => sendDM(p.id)}
                disabled={busy === p.id}
                className="shrink-0 flex flex-col items-center gap-1.5 w-16 group"
              >
                <span className="relative">
                  <img
                    src={avatarFor({ avatar_url: p.avatar_url, name: p.name })}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover border-2 border-accent shadow-soft group-hover:scale-105 transition-smooth"
                    style={{ borderColor: "hsl(var(--accent))" }}
                  />
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-cta text-white flex items-center justify-center shadow-glow">
                    <Send className="h-2.5 w-2.5" />
                  </span>
                </span>
                <span className="text-[11px] font-semibold truncate w-full text-center">{p.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        )}

        <div className="my-4 h-px bg-border/60" />

        {/* External share */}
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Share elsewhere</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={whatsapp}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-white font-semibold shadow-soft hover:shadow-glow transition-smooth"
            style={{ background: "#25D366" }}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-[11px]">WhatsApp</span>
          </button>
          <button
            onClick={copy}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-secondary hover:bg-secondary/70 transition-smooth font-semibold"
          >
            <Copy className="h-5 w-5" />
            <span className="text-[11px]">Copy link</span>
          </button>
          <button
            onClick={native}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-cta text-white font-semibold shadow-glow"
          >
            <Link2 className="h-5 w-5" />
            <span className="text-[11px]">More…</span>
          </button>
        </div>
      </div>
    </div>
  );
};
