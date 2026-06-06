import { useEffect, useRef, useState } from "react";
import { X, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  communityId: string;
  communityName: string;
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
}

export const CodeOfConductDialog = ({ communityId, communityName, open, onClose, onAccepted }: Props) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [scrolledEnd, setScrolledEnd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setAgreed(false); setScrolledEnd(false); return; }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("community_code_of_conduct")
        .select("content_md,version")
        .eq("community_id", communityId)
        .maybeSingle();
      setContent(data?.content_md ?? "Be respectful. No hate speech. Follow community guidelines.");
      setVersion(data?.version ?? 1);
      setLoading(false);
    })();
  }, [open, communityId]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setScrolledEnd(true);
  };

  const accept = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("community_coc_acceptances")
      .upsert({ community_id: communityId, user_id: user.id, version, accepted_at: new Date().toISOString() }, { onConflict: "community_id,user_id" });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    onAccepted();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-foreground/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl w-full max-w-md shadow-elevated max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Code of Conduct</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground px-5 pt-3">Joining <b>{communityName}</b> requires accepting the rules.</p>
        <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-5 py-4 text-sm whitespace-pre-wrap prose-sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : content}
        </div>
        <div className="px-5 py-4 border-t border-border space-y-3 bg-card">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={agreed} disabled={!scrolledEnd} onChange={(e) => setAgreed(e.target.checked)} />
            <span className="text-xs">
              I have read and agree to the Code of Conduct.
              {!scrolledEnd && <span className="block text-muted-foreground">Scroll to the end to enable.</span>}
            </span>
          </label>
          <button onClick={accept} disabled={!agreed || submitting} className="w-full py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50">
            {submitting ? "Joining…" : "Accept & Join"}
          </button>
        </div>
      </div>
    </div>
  );
};