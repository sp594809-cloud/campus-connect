import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Pin, Plus, Send, Share2, Sparkles, X, Paperclip, FileText } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avatarFor } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import networkBg from "@/assets/network-bg.jpg";
import { uploadAttachment, detectKind } from "@/lib/uploads";

interface FeedPost {
  id: string;
  content: string;
  type: string;
  tag: string | null;
  pinned: boolean;
  created_at: string;
  author_id: string;
  attachment_url: string | null;
  attachment_type: string | null;
  author: { name: string; avatar_url: string | null; branch: string | null; year: string | null; placement_status: string; company: string | null; college_email_verified: boolean } | null;
  likes: { user_id: string }[];
}

const filters = ["All Campus", "My Branch", "My Interests"] as const;

export const HomeScreen = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [filter, setFilter] = useState<typeof filters[number]>("All Campus");
  const [showCompose, setShowCompose] = useState(false);
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [attachment, setAttachment] = useState<{ url: string; type: "image" | "pdf" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id,content,type,tag,pinned,created_at,author_id,attachment_url,attachment_type,author:profiles!posts_author_id_fkey(name,avatar_url,branch,year,placement_status,company,college_email_verified),likes:post_likes(user_id)")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data ?? []) as unknown as FeedPost[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = posts.filter((p) => {
    if (filter === "My Branch") return p.author?.branch && profile?.branch && p.author.branch === profile.branch;
    if (filter === "My Interests") return true; // tag-based filter could be richer
    return true;
  });

  const toggleLike = async (postId: string, liked: boolean) => {
    if (!user) return;
    setPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, likes: liked ? p.likes.filter((l) => l.user_id !== user.id) : [...p.likes, { user_id: user.id }] }
        : p
    ));
    if (liked) await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    else await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  };

  const submitPost = async () => {
    if (!user || (!draft.trim() && !attachment)) return;
    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      content: draft.trim().slice(0, 500) || "",
      tag: tag.trim().slice(0, 30) || null,
      type: "update",
      attachment_url: attachment?.url ?? null,
      attachment_type: attachment?.type ?? null,
    });
    if (error) return toast.error(error.message);
    setDraft(""); setTag(""); setAttachment(null); setShowCompose(false);
    toast.success("Posted!");
    load();
  };

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!detectKind(file)) { toast.error("Only images and PDFs allowed"); return; }
    setUploading(true);
    try {
      const r = await uploadAttachment(file, "post-media", user.id);
      if (r) setAttachment(r);
    } catch (err: any) { toast.error(err.message ?? "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="animate-fade-in-up">
      <Header title="Campus Feed" subtitle="What's happening today" showSearch />

      <div className="px-5 pt-4">
        <div
          className="relative rounded-3xl overflow-hidden p-5 text-primary-foreground shadow-glow"
          style={{
            backgroundImage: `linear-gradient(135deg, hsl(234 70% 22% / 0.85), hsl(264 75% 38% / 0.85)), url(${networkBg})`,
            backgroundSize: "cover",
          }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back
          </div>
          <p className="mt-2 text-lg font-bold leading-snug">
            Hi {profile?.name?.split(" ")[0] ?? "there"} 👋 — share what you're building.
          </p>
          <button
            onClick={() => setShowCompose(true)}
            className="mt-3 inline-flex items-center gap-1.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 backdrop-blur px-3 py-1.5 rounded-full text-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> Create post
          </button>
        </div>
      </div>

      <div className="px-5 mt-5 flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-smooth",
              filter === f ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-5 mt-4 space-y-3">
        {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading feed…</p>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-semibold">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">Be the first to post!</p>
          </div>
        )}
        {filtered.map((post, i) => {
          const liked = !!user && post.likes.some((l) => l.user_id === user.id);
          const author = post.author;
          return (
            <article
              key={post.id}
              className={cn(
                "rounded-2xl bg-card p-4 shadow-soft border border-border/60 animate-fade-in-up",
                post.pinned && "border-accent/40 bg-gradient-card"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {post.pinned && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent mb-2 uppercase tracking-wider">
                  <Pin className="h-3 w-3" /> Pinned
                </div>
              )}
              <div className="flex items-center gap-3">
                <img src={avatarFor({ avatar_url: author?.avatar_url ?? null, name: author?.name ?? "?" })} alt="" loading="lazy" className="h-11 w-11 rounded-full object-cover ring-2 ring-background shadow-soft" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{author?.name ?? "Unknown"}</p>
                    {author?.college_email_verified && <span className="text-[10px]">✓</span>}
                    {author?.placement_status === "Placed" && author.company && (
                      <span className="text-[10px] bg-success/15 text-success font-bold px-1.5 py-0.5 rounded">@ {author.company}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {author?.branch} · {author?.year} year · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
                {post.tag && <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-soft text-accent px-2 py-1 rounded-full">{post.tag}</span>}
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>
              {post.attachment_url && post.attachment_type === "image" && (
                <a href={post.attachment_url} target="_blank" rel="noreferrer">
                  <img src={post.attachment_url} alt="" loading="lazy" className="mt-3 rounded-2xl w-full max-h-96 object-cover" />
                </a>
              )}
              {post.attachment_url && post.attachment_type === "pdf" && (
                <a href={post.attachment_url} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-secondary hover:bg-secondary/70 transition-smooth">
                  <FileText className="h-7 w-7 text-red-600" />
                  <div className="flex-1"><p className="text-sm font-semibold">PDF Document</p><p className="text-xs text-muted-foreground">Tap to open</p></div>
                </a>
              )}
              <div className="mt-4 flex items-center gap-1 text-muted-foreground">
                <button onClick={() => toggleLike(post.id, liked)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth", liked ? "text-accent bg-accent-soft" : "hover:bg-secondary")}>
                  <Heart className={cn("h-4 w-4", liked && "fill-current")} /> {post.likes.length}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-secondary transition-smooth">
                  <MessageCircle className="h-4 w-4" /> 0
                </button>
                <button className="ml-auto p-1.5 rounded-full hover:bg-secondary transition-smooth" aria-label="Share"><Share2 className="h-4 w-4" /></button>
              </div>
            </article>
          );
        })}
      </div>

      {showCompose && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 overflow-y-auto animate-fade-in-up" onClick={() => setShowCompose(false)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated animate-scale-in my-auto max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">New post</h3>
              <button onClick={() => setShowCompose(false)} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 500))} rows={4} placeholder="Share an update, ask a question, celebrate a win…" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            {attachment && (
              <div className="mt-2 relative">
                {attachment.type === "image" ? (
                  <img src={attachment.url} alt="" className="rounded-xl max-h-48 w-full object-cover" />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl"><FileText className="h-5 w-5 text-red-600" /><span className="text-xs">PDF attached</span></div>
                )}
                <button onClick={() => setAttachment(null)} className="absolute top-1 right-1 h-7 w-7 rounded-full bg-foreground/70 text-background flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag (optional)" maxLength={30} className="flex-1 px-3 py-2 rounded-full bg-secondary text-xs focus:outline-none" />
              <span className="text-[11px] text-muted-foreground ml-2">{draft.length}/500</span>
            </div>
            <div className="flex gap-2 mt-3">
              <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={pickFile} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Attach" className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center disabled:opacity-50">
                <Paperclip className="h-5 w-5" />
              </button>
              <button onClick={submitPost} disabled={(!draft.trim() && !attachment) || uploading} className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
                <Send className="h-4 w-4" /> {uploading ? "Uploading…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};