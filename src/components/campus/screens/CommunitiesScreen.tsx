import { useEffect, useRef, useState } from "react";
import { Users, Plus, X, Trash2, ArrowLeft, Send, Paperclip, FileText, Settings, CheckCheck, Lock, LogOut } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ALL_INTERESTS } from "@/data/constants";
import { uploadAttachment, detectKind } from "@/lib/uploads";
import { formatDistanceToNow } from "date-fns";
import { avatarFor } from "@/hooks/useProfiles";
import { ConfirmDialog } from "../ConfirmDialog";

interface Community {
  id: string;
  name: string;
  description: string;
  interest: string;
  emoji: string;
  color: string;
  member_count: number;
  created_by: string | null;
  admins_only?: boolean;
}

interface CMsg {
  id: string;
  community_id: string;
  sender_id: string;
  content: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  sender?: { name: string; avatar_url: string | null };
}

export const CommunitiesScreen = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", interest: ALL_INTERESTS[0], emoji: "✨", color: "from-violet-500 to-fuchsia-500" });
  const [submitting, setSubmitting] = useState(false);
  const [activeChat, setActiveChat] = useState<Community | null>(null);
  const [confirmDel, setConfirmDel] = useState<Community | null>(null);
  const [working, setWorking] = useState(false);

  const load = async () => {
    const { data: comms } = await supabase.from("communities").select("*").order("name");
    const { data: members } = await supabase.from("community_members").select("community_id, user_id");
    const counts: Record<string, number> = {};
    const mine: Record<string, boolean> = {};
    (members ?? []).forEach((m) => {
      counts[m.community_id] = (counts[m.community_id] ?? 0) + 1;
      if (m.user_id === user?.id) mine[m.community_id] = true;
    });
    setCommunities((comms ?? []).map((c) => ({ ...c, member_count: counts[c.id] ?? 0 })));
    setJoined(mine);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const createCommunity = async () => {
    if (!user || !form.name.trim()) { toast.error("Name is required"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("communities").insert({
      name: form.name.trim(),
      description: form.description.trim(),
      interest: form.interest,
      emoji: form.emoji || "✨",
      color: form.color,
      created_by: user.id,
    }).select("id").single();
    if (!error && data) {
      await supabase.from("community_members").insert({ community_id: data.id, user_id: user.id });
    }
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(`${form.name} created!`);
    setShowCreate(false);
    setForm({ name: "", description: "", interest: ALL_INTERESTS[0], emoji: "✨", color: "from-violet-500 to-fuchsia-500" });
    load();
  };

  const toggle = async (c: Community) => {
    if (!user) return;
    const isJoined = joined[c.id];
    setJoined((p) => ({ ...p, [c.id]: !isJoined }));
    setCommunities((prev) => prev.map((x) => x.id === c.id ? { ...x, member_count: x.member_count + (isJoined ? -1 : 1) } : x));
    if (isJoined) {
      await supabase.from("community_members").delete().eq("community_id", c.id).eq("user_id", user.id);
      toast.success(`Left ${c.name}`);
    } else {
      await supabase.from("community_members").insert({ community_id: c.id, user_id: user.id });
      toast.success(`Joined ${c.name}!`);
    }
  };

  const deleteCommunity = async () => {
    if (!user || !confirmDel) return;
    setWorking(true);
    const { error } = await supabase.from("communities").delete().eq("id", confirmDel.id);
    setWorking(false);
    if (error) return toast.error(error.message);
    toast.success(`${confirmDel.name} deleted`);
    setCommunities((prev) => prev.filter((x) => x.id !== confirmDel.id));
    setConfirmDel(null);
  };

  const myCommunities = communities.filter((c) => joined[c.id]);

  if (activeChat) {
    return <CommunityChat community={activeChat} onBack={() => { setActiveChat(null); load(); }} />;
  }

  return (
    <div className="animate-fade-in-up">
      <Header title="Communities" subtitle="Tribes built around what you love" />
      <div className="px-5 mt-3 flex justify-end">
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 bg-gradient-hero text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-soft hover:shadow-glow transition-smooth">
          <Plus className="h-4 w-4" /> New community
        </button>
      </div>
      {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}

      {myCommunities.length > 0 && (
        <div className="px-5 mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Your communities</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {myCommunities.map((c) => (
              <button key={c.id} onClick={() => setActiveChat(c)} className={cn("min-w-[140px] text-left rounded-2xl p-3 text-white shadow-soft bg-gradient-to-br hover:shadow-glow active:scale-95 transition-smooth", c.color)}>
                <div className="text-2xl">{c.emoji}</div>
                <p className="text-sm font-bold mt-1 leading-tight">{c.name}</p>
                <p className="text-[11px] opacity-80 mt-0.5">Tap to open · {c.member_count} members</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Explore all</p>
        <div className="space-y-3">
          {communities.map((c, i) => (
            <div key={c.id} className="rounded-2xl bg-card border border-border/60 shadow-soft p-4 flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
              <div className={cn("h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-soft", c.color)}>{c.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1"><Users className="h-3 w-3" /> {c.member_count}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {c.created_by === user?.id && (
                  <button onClick={() => setConfirmDel(c)} aria-label="Delete" className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-smooth">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {joined[c.id] && (
                  <button onClick={() => setActiveChat(c)} className="px-3 py-1.5 rounded-full text-xs font-bold bg-accent text-accent-foreground hover:shadow-glow transition-smooth">Chat</button>
                )}
                <button onClick={() => toggle(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-smooth",
                  joined[c.id] ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground hover:shadow-glow")}>
                  {joined[c.id] ? "Joined" : "Join"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 overflow-y-auto animate-fade-in-up" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated animate-scale-in space-y-3 my-auto max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Create community</h3>
              <button onClick={() => setShowCreate(false)} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2">
              <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value.slice(0, 2) })} className="w-14 px-3 py-2 rounded-2xl bg-secondary text-center text-lg focus:outline-none" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Community name *" className="flex-1 px-3 py-2 rounded-2xl bg-secondary text-sm focus:outline-none" />
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What's this community about?" className="w-full px-3 py-2 rounded-2xl bg-secondary text-sm focus:outline-none resize-none" />
            <select value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} className="w-full px-3 py-2 rounded-2xl bg-secondary text-sm focus:outline-none">
              {ALL_INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <button onClick={createCommunity} disabled={submitting} className="w-full py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50">
              {submitting ? "Creating…" : "Create community"}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDel}
        title={`Delete "${confirmDel?.name ?? ""}"?`}
        description="This will permanently remove the community and all its messages."
        confirmLabel="Delete community"
        destructive
        busy={working}
        onCancel={() => setConfirmDel(null)}
        onConfirm={deleteCommunity}
      />
    </div>
  );
};

const CommunityChat = ({ community, onBack }: { community: Community; onBack: () => void }) => {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<CMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [adminsOnly, setAdminsOnly] = useState(!!community.admins_only);
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAdmin = community.created_by === user?.id;
  const canSend = isAdmin || !adminsOnly;

  const load = async () => {
    const { data } = await supabase.from("community_messages").select("*").eq("community_id", community.id).order("created_at", { ascending: true }).limit(200);
    const rows = (data ?? []) as CMsg[];
    const ids = Array.from(new Set(rows.map((r) => r.sender_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,name,avatar_url").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      rows.forEach((r) => { r.sender = map.get(r.sender_id) as any; });
    }
    setMsgs(rows);
    // refresh admins_only
    const { data: c } = await supabase.from("communities").select("admins_only").eq("id", community.id).maybeSingle();
    if (c) setAdminsOnly(!!(c as any).admins_only);
  };

  useEffect(() => { load(); }, [community.id]);

  useEffect(() => {
    const ch = supabase
      .channel(`comm-${community.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages", filter: `community_id=eq.${community.id}` }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "communities", filter: `id=eq.${community.id}` }, (p) => setAdminsOnly(!!(p.new as any).admins_only))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [community.id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!user || !draft.trim() || !canSend) return;
    const text = draft.trim().slice(0, 1000);
    setDraft("");
    const { error } = await supabase.from("community_messages").insert({ community_id: community.id, sender_id: user.id, content: text });
    if (error) toast.error(error.message);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !user || !canSend) return;
    if (!detectKind(file)) { toast.error("Only images and PDFs allowed"); return; }
    setUploading(true);
    try {
      const r = await uploadAttachment(file, "chat-media", user.id);
      if (r) await supabase.from("community_messages").insert({ community_id: community.id, sender_id: user.id, content: null, attachment_url: r.url, attachment_type: r.type });
    } catch (err: any) { toast.error(err.message ?? "Upload failed"); }
    finally { setUploading(false); }
  };

  const toggleAdminsOnly = async () => {
    const next = !adminsOnly;
    setAdminsOnly(next);
    const { error } = await supabase.from("communities").update({ admins_only: next }).eq("id", community.id);
    if (error) { toast.error(error.message); setAdminsOnly(!next); }
    else toast.success(next ? "Only admins can send" : "All members can send");
  };

  const leaveGroup = async () => {
    if (!user) return;
    setLeaving(true);
    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", community.id)
      .eq("user_id", user.id);
    setLeaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Left ${community.name}`);
    setConfirmLeave(false);
    setShowSettings(false);
    onBack();
  };

  return (
    <div className="flex flex-col h-screen animate-fade-in-up">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-4 pt-6 pb-3 border-b border-border flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
        <div className={cn("h-10 w-10 rounded-2xl bg-gradient-to-br flex items-center justify-center text-xl", community.color)}>{community.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{community.name}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> {community.member_count} members{adminsOnly && <> · <Lock className="h-3 w-3" /> admins only</>}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowSettings(true)} aria-label="Settings" className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center"><Settings className="h-5 w-5" /></button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 pb-36 bg-[hsl(var(--muted))]/30">
        {msgs.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No messages yet. Say hi 👋</p>}
        {msgs.map((m) => {
          const fromMe = m.sender_id === user?.id;
          return (
            <div key={m.id} className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[78%] px-2.5 py-1.5 rounded-2xl text-sm shadow-soft animate-scale-in",
                fromMe ? "bg-[#dcf8c6] rounded-br-sm" : "bg-white border border-border/50 rounded-bl-sm")}>
                {!fromMe && m.sender && (
                  <p className="text-[11px] font-bold text-primary px-1">{m.sender.name}</p>
                )}
                {m.attachment_url && m.attachment_type === "image" && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer">
                    <img src={m.attachment_url} alt="" className="rounded-lg max-h-60 object-cover mb-1" />
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
                  {fromMe && <CheckCheck className="h-3.5 w-3.5 text-blue-500" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-3 pb-20 bg-background/95 backdrop-blur-xl border-t border-border">
        {canSend ? (
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Attach" className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center disabled:opacity-50"><Paperclip className="h-5 w-5" /></button>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message group…" maxLength={1000} className="flex-1 bg-secondary rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={send} aria-label="Send" className="h-11 w-11 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-glow active:scale-95"><Send className="h-4 w-4" /></button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2 py-3"><Lock className="h-4 w-4" /> Only admins can send messages.</p>
        )}
        {uploading && <p className="text-[11px] text-muted-foreground mt-1 text-center">Uploading…</p>}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Group settings</h3>
              <button onClick={() => setShowSettings(false)} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <button onClick={toggleAdminsOnly} className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-smooth">
              <div className="text-left">
                <p className="text-sm font-semibold">Only admins can send messages</p>
                <p className="text-xs text-muted-foreground">Restrict who can post in this community</p>
              </div>
              <div className={cn("w-11 h-6 rounded-full relative transition-smooth", adminsOnly ? "bg-primary" : "bg-muted-foreground/30")}>
                <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-soft transition-transform", adminsOnly ? "translate-x-5" : "translate-x-0.5")} />
              </div>
            </button>
            {!isAdmin && (
              <button
                onClick={() => setConfirmLeave(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border bg-background text-sm font-semibold text-muted-foreground hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-smooth"
              >
                <LogOut className="h-4 w-4" /> Leave group
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmLeave}
        title={`Leave ${community.name}?`}
        description="You'll stop receiving messages from this group. You can rejoin anytime."
        confirmLabel="Leave group"
        destructive
        busy={leaving}
        onCancel={() => setConfirmLeave(false)}
        onConfirm={leaveGroup}
      />
    </div>
  );
};