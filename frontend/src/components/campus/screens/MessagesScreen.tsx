import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Flag, Send, Sparkles, Paperclip, FileText, Check, CheckCheck, X } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avatarFor, type PublicProfile } from "@/hooks/useProfiles";
import { iceBreakers } from "@/data/constants";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { uploadAttachment, detectKind } from "@/lib/uploads";
import { fetchPublicProfilesByIds } from "@/lib/api/profiles";
import { toast } from "sonner";
import { ReportSheet } from "@/components/safety/ReportSheet";

interface ConvRow {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string;
  other: PublicProfile;
  preview?: string;
  unread: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  read: boolean;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

export const MessagesScreen = ({ openWith, onClearOpen }: { openWith: string | null; onClearOpen: () => void }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [activeConv, setActiveConv] = useState<{ id: string; other: PublicProfile } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    if (!user) return;
    const { data: convs, error: cErr } = await supabase
      .from("conversations")
      .select("id, user_a, user_b, last_message_at")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    if (cErr) { toast.error(cErr.message); setLoading(false); return; }
    if (!convs?.length) { setConversations([]); setLoading(false); return; }

    const otherIds = convs.map((c) => c.user_a === user.id ? c.user_b : c.user_a);
    const profs = await fetchPublicProfilesByIds(otherIds).catch((err) => {
      console.error("[Messages] profiles", err); return [] as PublicProfile[];
    });
    const profMap = new Map(profs.map((p) => [p.id, p]));

    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("conversation_id, content, sender_id, read, created_at, attachment_type")
      .in("conversation_id", convs.map((c) => c.id))
      .order("created_at", { ascending: false });
    const lastByConv = new Map<string, { content: string; sender_id: string }>();
    const unreadByConv = new Map<string, number>();
    (lastMsgs ?? []).forEach((m) => {
      if (!lastByConv.has(m.conversation_id)) {
        const preview = m.attachment_type === "image" ? "📷 Photo" : m.attachment_type === "pdf" ? "📄 Document" : (m.content ?? "");
        lastByConv.set(m.conversation_id, { content: preview, sender_id: m.sender_id });
      }
      if (!m.read && m.sender_id !== user.id) unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
    });

    setConversations(convs.map((c) => {
      const otherId = c.user_a === user.id ? c.user_b : c.user_a;
      const last = lastByConv.get(c.id);
      return {
        ...c,
        other: profMap.get(otherId) as PublicProfile,
        preview: last ? (last.sender_id === user.id ? `You: ${last.content}` : last.content) : "Say hi 👋",
        unread: unreadByConv.get(c.id) ?? 0,
      };
    }).filter((c) => c.other));
    setLoading(false);
  };

  useEffect(() => { loadConversations(); }, [user?.id]);

  // Open chat when arriving from Discover
  useEffect(() => {
    if (!openWith || !user) return;
    (async () => {
      const { data: convId, error: rpcErr } = await supabase.rpc("get_or_create_conversation", { other_user: openWith });
      if (rpcErr) { toast.error(rpcErr.message); onClearOpen(); return; }
      const profs = await fetchPublicProfilesByIds([openWith]).catch(() => [] as PublicProfile[]);
      const prof = profs[0];
      if (convId && prof) setActiveConv({ id: convId as unknown as string, other: prof });
      onClearOpen();
    })();
  }, [openWith, user]);

  // Realtime subscription on messages — refresh list and active chat
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  if (activeConv) {
    return <ChatView convId={activeConv.id} other={activeConv.other} onBack={() => { setActiveConv(null); loadConversations(); }} />;
  }

  return (
    <div className="animate-fade-in-up">
      <Header title="Messages" subtitle="Your campus conversations" />
      {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
      {!loading && conversations.length === 0 && (
        <div className="text-center py-12 px-5">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-semibold">No chats yet</p>
          <p className="text-sm text-muted-foreground">Head to Discover and message someone interesting.</p>
        </div>
      )}
      <div className="px-5 mt-3 space-y-1">
        {conversations.map((t) => (
          <button key={t.id} onClick={() => setActiveConv({ id: t.id, other: t.other })} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-smooth text-left">
            <img src={avatarFor(t.other)} alt="" loading="lazy" className="h-12 w-12 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm truncate">{t.other.name}</p>
                <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}</span>
              </div>
              <p className={cn("text-xs truncate", t.unread ? "text-foreground font-semibold" : "text-muted-foreground")}>{t.preview}</p>
            </div>
            {t.unread > 0 && (
              <span className="bg-accent text-accent-foreground text-[10px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center">{t.unread}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const ChatView = ({ convId, other, onBack }: { convId: string; other: PublicProfile; onBack: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reportMsg, setReportMsg] = useState<MessageRow | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
    setMessages((data ?? []) as MessageRow[]);
    // mark as read
    if (user) {
      await supabase.from("messages").update({ read: true }).eq("conversation_id", convId).neq("sender_id", user.id);
    }
  };

  useEffect(() => { load(); }, [convId]);

  useEffect(() => {
    const ch = supabase
      .channel(`conv-${convId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as MessageRow]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!user || !text.trim()) return;
    setDraft("");
    await supabase.from("messages").insert({ conversation_id: convId, sender_id: user.id, content: text.trim().slice(0, 1000) });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!detectKind(file)) { toast.error("Only images and PDFs allowed"); return; }
    setUploading(true);
    try {
      const result = await uploadAttachment(file, "chat-media", user.id);
      if (!result) return;
      await supabase.from("messages").insert({
        conversation_id: convId, sender_id: user.id,
        content: null, attachment_url: result.url, attachment_type: result.type,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally { setUploading(false); }
  };

  const sharedInterest = other.interests[0] ?? "tech";

  return (
    <div className="flex flex-col h-screen animate-fade-in-up">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl px-4 pt-6 pb-3 border-b border-border flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
        <img src={avatarFor(other)} alt={other.name} className="h-10 w-10 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{other.name}</p>
          <p className="text-[11px] text-muted-foreground">{other.branch ?? "—"} · {other.year ?? "—"} year{other.open_to_mentor ? " · 🧑‍🏫 Mentor" : ""}</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 pb-36 bg-[hsl(var(--muted))]/30">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex h-16 w-16 rounded-full bg-gradient-hero items-center justify-center text-primary-foreground mb-3 shadow-glow animate-pulse-glow">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="font-bold">Break the ice with {other.name.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Try one of these openers:</p>
            <div className="space-y-2">
              {iceBreakers.map((tpl) => {
                const t = tpl.replace("{interest}", sharedInterest);
                return (
                  <button key={tpl} onClick={() => send(t)} className="w-full text-left text-sm p-3 rounded-2xl bg-card border border-border hover:border-accent hover:shadow-soft transition-smooth">
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {messages.map((m) => {
          const fromMe = m.sender_id === user?.id;
          const startPress = () => {
            if (fromMe) return;
            pressTimer.current = setTimeout(() => setReportMsg(m), 550);
          };
          const cancelPress = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };
          return (
            <div key={m.id} className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
              <div
                onContextMenu={(e) => { if (!fromMe) { e.preventDefault(); setReportMsg(m); } }}
                onTouchStart={startPress}
                onTouchEnd={cancelPress}
                onTouchMove={cancelPress}
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                className={cn("max-w-[78%] px-2.5 py-1.5 rounded-2xl text-sm shadow-soft animate-scale-in select-none",
                fromMe
                  ? "bg-[#dcf8c6] text-foreground rounded-br-sm"
                  : "bg-white text-foreground rounded-bl-sm border border-border/50")}>
                {m.attachment_url && m.attachment_type === "image" && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer">
                    <img src={m.attachment_url} alt="attachment" className="rounded-lg max-h-60 object-cover mb-1" />
                  </a>
                )}
                {m.attachment_url && m.attachment_type === "pdf" && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/5 rounded-lg p-2 mb-1">
                    <FileText className="h-6 w-6 text-red-600" />
                    <span className="text-xs font-medium underline">Open PDF</span>
                  </a>
                )}
                {m.content && <div className="px-1 whitespace-pre-wrap break-words">{m.content}</div>}
                <div className={cn("text-[10px] mt-0.5 flex items-center gap-1 opacity-70", fromMe ? "justify-end" : "")}>
                  <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: false })}</span>
                  {fromMe && (m.read ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> : <CheckCheck className="h-3.5 w-3.5" />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-3 pb-20 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" hidden onChange={handleFile} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label="Attach" className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 disabled:opacity-50">
            <Paperclip className="h-5 w-5" />
          </button>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(draft)} placeholder="Write a message…" maxLength={1000} className="flex-1 bg-secondary rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={() => send(draft)} aria-label="Send" className="h-11 w-11 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-glow active:scale-95 transition-smooth"><Send className="h-4 w-4" /></button>
        </div>
        {uploading && <p className="text-[11px] text-muted-foreground mt-1 text-center">Uploading…</p>}
      </div>

      <ReportSheet
        open={!!reportMsg}
        onClose={() => setReportMsg(null)}
        contentType="message"
        contentId={reportMsg?.id ?? ""}
        reportedUserId={reportMsg?.sender_id ?? null}
      />
    </div>
  );
};