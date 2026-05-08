import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Hash, Heart, MessageCircle, MoreHorizontal, Pencil, Pin, Plus, Search, Send, Share2, Sparkles, Trash2, User, X, Paperclip, FileText } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avatarFor } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import networkBg from "@/assets/network-bg.jpg";
import { uploadAttachment, detectKind } from "@/lib/uploads";
import { fetchProfilesByIds } from "@/lib/api/profiles";
import { StreakBanner } from "../StreakBanner";
import { ConfirmDialog } from "../ConfirmDialog";
import { ShareDrawer } from "../ShareDrawer";

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
  comments: { count: number }[];
}

const filters = ["All Campus", "My Branch", "My Interests"] as const;
const CATEGORIES = ["All", "Placement", "Exams", "Social", "DSA", "Internship", "Hackathon", "Project"] as const;
type SearchMode = "name" | "enrollment";

export const HomeScreen = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [filter, setFilter] = useState<typeof filters[number]>("All Campus");
  const [showCompose, setShowCompose] = useState(false);
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [attachment, setAttachment] = useState<{ url: string; type: "image" | "pdf" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeedPost | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<FeedPost | null>(null);
  const [working, setWorking] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("name");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [enrollmentMatchName, setEnrollmentMatchName] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>("All");
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id,content,type,tag,pinned,created_at,author_id,attachment_url,attachment_type,author:profiles!posts_author_id_fkey(name,avatar_url,branch,year,placement_status,company,college_email_verified),likes:post_likes(user_id),comments:post_comments(count)")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data ?? []) as unknown as FeedPost[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Enrollment lookup → resolve to a full name then match author
  useEffect(() => {
    if (searchMode !== "enrollment" || !searchTerm.trim()) { setEnrollmentMatchName(null); return; }
    let alive = true;
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("student1")
        .select("full_name,enrollment_id")
        .ilike("enrollment_id", `%${searchTerm.trim()}%`)
        .limit(1)
        .maybeSingle<{ full_name: string; enrollment_id: string }>();
      if (error) console.error("[enrollment lookup]", error);
      if (alive) setEnrollmentMatchName(data?.full_name ?? null);
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [searchMode, searchTerm]);

  const filtered = posts.filter((p) => {
    if (filter === "My Branch" && !(p.author?.branch && profile?.branch && p.author.branch === profile.branch)) return false;
    if (activeCategory !== "All") {
      const haystack = `${p.tag ?? ""} ${p.content}`.toLowerCase();
      if (!haystack.includes(activeCategory.toLowerCase())) return false;
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      if (searchMode === "name") {
        if (!(p.author?.name ?? "").toLowerCase().includes(q)) return false;
      } else {
        if (!enrollmentMatchName) return false;
        if ((p.author?.name ?? "").toLowerCase() !== enrollmentMatchName.toLowerCase()) return false;
      }
    }
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
    if (!user) return;
    const trimmed = draft.trim();
    if (trimmed.length < 10 && !attachment) {
      toast.error("Post needs at least 10 characters");
      return;
    }
    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      content: trimmed.slice(0, 500),
      tag: tag.trim().slice(0, 30) || null,
      type: "update",
      attachment_url: attachment?.url ?? null,
      attachment_type: attachment?.type ?? null,
    });
    if (error) return toast.error(error.message);
    setDraft(""); setTag(""); setAttachment(null); setShowCompose(false);
    toast.success("Post published 🎉", {
      description: "Your update is live on the campus feed.",
      style: {
        background: "hsl(152 68% 38%)",
        color: "white",
        border: "1px solid hsl(152 68% 32%)",
      },
    });
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    }
    finally { setUploading(false); }
  };

  const saveEdit = async () => {
    if (!editing || !user) return;
    const trimmed = editDraft.trim();
    if (trimmed.length < 10) { toast.error("Post needs at least 10 characters"); return; }
    setWorking(true);
    const { error } = await supabase.from("posts").update({ content: trimmed.slice(0, 500) }).eq("id", editing.id);
    setWorking(false);
    if (error) return toast.error(error.message);
    toast.success("Post updated");
    setEditing(null);
    load();
  };

  const deletePost = async () => {
    if (!confirmDelete) return;
    setWorking(true);
    const { error } = await supabase.from("posts").delete().eq("id", confirmDelete.id);
    setWorking(false);
    if (error) return toast.error(error.message);
    setPosts((p) => p.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
    toast.success("Post deleted");
  };

  return (
    <div className="animate-fade-in-up">
      <Header title="Campus Feed" subtitle="What's happening today" showSearch />

      <div className="px-5 pt-4">
        <StreakBanner />
      </div>

      {/* Advanced search */}
      <div className="px-5 pt-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl glass-card px-3 py-2 transition-smooth",
            searchFocused && "ring-2 ring-primary shadow-[0_0_0_4px_hsl(222_60%_18%/0.18)]"
          )}
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={searchMode === "name" ? "Search by student name…" : "Search by enrollment number…"}
            maxLength={60}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            aria-label="Search feed"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} aria-label="Clear" className="h-6 w-6 rounded-full hover:bg-secondary/60 flex items-center justify-center">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="flex items-center rounded-xl bg-secondary/70 p-0.5 shrink-0">
            {(["name", "enrollment"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSearchMode(m)}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-smooth inline-flex items-center gap-1",
                  searchMode === m ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
                )}
              >
                {m === "name" ? <User className="h-3 w-3" /> : <Hash className="h-3 w-3" />}
                {m === "name" ? "Name" : "Enr."}
              </button>
            ))}
          </div>
        </div>
        {searchMode === "enrollment" && searchTerm.trim() && (
          <p className="text-[11px] text-muted-foreground mt-1.5 ml-1">
            {enrollmentMatchName ? <>Matches <b className="text-foreground">{enrollmentMatchName}</b></> : "No student found for this enrollment"}
          </p>
        )}
      </div>

      {/* Category tags */}
      <div className="px-5 pt-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((c) => {
          const isActive = activeCategory === c;
          return (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-smooth border",
                isActive
                  ? "bg-gradient-cta text-white border-transparent shadow-glow"
                  : "bg-secondary/60 text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {c === "All" ? c : `#${c}`}
            </button>
          );
        })}
      </div>

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
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setShowCompose(true)} className="inline-flex items-center gap-1.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 backdrop-blur px-3 py-1.5 rounded-full text-sm font-semibold">
              <Plus className="h-4 w-4" /> Create post
            </button>
            <button onClick={() => navigate("/interview")} className="inline-flex items-center gap-1.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 backdrop-blur px-3 py-1.5 rounded-full text-sm font-semibold">
              <Briefcase className="h-4 w-4" /> Placement Hub
            </button>
          </div>
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
                <img
                  src={avatarFor({ avatar_url: author?.avatar_url ?? null, name: author?.name ?? "?" })}
                  alt=""
                  loading="lazy"
                  className="h-11 w-11 rounded-full object-cover border-2 border-[hsl(30_25%_98%)] shadow-soft bg-gradient-hero"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => post.author_id && navigate(`/u/${post.author_id}`)} className="font-semibold text-sm truncate hover:underline text-left">{author?.name ?? "Unknown"}</button>
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
                {post.author_id === user?.id && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuFor((m) => (m === post.id ? null : post.id))}
                      aria-label="Post options"
                      className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuFor === post.id && (
                      <>
                        <button
                          aria-label="Close menu"
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setMenuFor(null)}
                        />
                        <div className="absolute right-0 top-9 z-20 w-40 glass-card rounded-2xl shadow-elevated overflow-hidden animate-scale-in">
                          <button
                            onClick={() => { setEditing(post); setEditDraft(post.content); setMenuFor(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-secondary/60 text-left"
                          >
                            <Pencil className="h-4 w-4" /> Edit post
                          </button>
                          <button
                            onClick={() => { setConfirmDelete(post); setMenuFor(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold hover:bg-destructive/10 text-destructive text-left border-t border-border/50"
                          >
                            <Trash2 className="h-4 w-4" /> Delete post
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>
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
                <button onClick={() => setOpenComments(post.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-secondary transition-smooth">
                  <MessageCircle className="h-4 w-4" /> {post.comments?.[0]?.count ?? 0}
                </button>
                <button onClick={() => setSharePost(post)} className="ml-auto p-1.5 rounded-full hover:bg-secondary transition-smooth" aria-label="Share"><Share2 className="h-4 w-4" /></button>
              </div>
            </article>
          );
        })}
      </div>

      {openComments && <CommentsSheet postId={openComments} onClose={() => { setOpenComments(null); load(); }} />}

      <ShareDrawer
        open={!!sharePost}
        onClose={() => setSharePost(null)}
        title={sharePost ? `${sharePost.author?.name ?? "Someone"} on Campus Connect` : ""}
        preview={sharePost?.content?.slice(0, 140)}
        url={typeof window !== "undefined" && sharePost ? `${window.location.origin}/campus#post-${sharePost.id}` : ""}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this post?"
        description="This action is permanent. Your post and its likes & comments will be removed."
        confirmLabel="Delete post"
        destructive
        busy={working}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={deletePost}
      />

      {editing && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in-up" onClick={() => setEditing(null)}>
          <div className="glass-card rounded-3xl p-5 w-full max-w-md shadow-elevated animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Edit post</h3>
              <button onClick={() => setEditing(null)} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary/60 flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value.slice(0, 500))} rows={5} className="w-full px-4 py-3 rounded-2xl bg-secondary/70 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <div className="flex items-center justify-between mt-2">
              <span className={cn("text-[11px]", editDraft.trim().length < 10 ? "text-destructive font-semibold" : "text-muted-foreground")}>
                {editDraft.trim().length < 10 ? `${10 - editDraft.trim().length} more chars needed` : `${editDraft.length}/500`}
              </span>
              <button
                onClick={saveEdit}
                disabled={working || editDraft.trim().length < 10}
                className="px-5 py-2.5 rounded-2xl bg-gradient-cta text-white font-bold text-sm shadow-glow disabled:opacity-40 disabled:bg-none disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
              >
                {working ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {(() => {
                const tooShort = draft.trim().length < 10 && !attachment;
                return (
                  <button
                    onClick={submitPost}
                    disabled={tooShort || uploading}
                    className={cn(
                      "flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-smooth",
                      tooShort
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-gradient-cta text-white shadow-glow"
                    )}
                  >
                    <Send className="h-4 w-4" />
                    {uploading ? "Uploading…" : tooShort ? `Type ${Math.max(0, 10 - draft.trim().length)} more chars` : "Post"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface Comment { id: string; content: string; created_at: string; author_id: string; author?: { name: string; avatar_url: string | null } }

const CommentsSheet = ({ postId, onClose }: { postId: string; onClose: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select("id,content,created_at,author_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as Comment[];
    const ids = Array.from(new Set(rows.map((r) => r.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,name,avatar_url").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      rows.forEach((r) => { r.author = map.get(r.author_id) as any; });
    }
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => { load(); }, [postId]);

  useEffect(() => {
    const ch = supabase
      .channel(`comments-${postId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [postId]);

  const send = async () => {
    if (!user || !draft.trim()) return;
    const text = draft.trim().slice(0, 500);
    setDraft("");
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, author_id: user.id, content: text });
    if (error) toast.error(error.message);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-end justify-center animate-fade-in-up" onClick={onClose}>
      <div className="bg-card rounded-t-3xl w-full max-w-md max-h-[80vh] flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold">Comments</h3>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && <p className="text-center text-sm text-muted-foreground">Loading…</p>}
          {!loading && items.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Be the first to comment 💬</p>}
          {items.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <button onClick={() => navigate(`/u/${c.author_id}`)}>
                <img src={c.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.author?.name ?? "?")}`} alt="" className="h-8 w-8 rounded-full object-cover" />
              </button>
              <div className="flex-1 bg-secondary rounded-2xl px-3 py-2">
                <button onClick={() => navigate(`/u/${c.author_id}`)} className="text-xs font-bold hover:underline">{c.author?.name ?? "User"}</button>
                <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border flex items-center gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Add a comment…" maxLength={500} className="flex-1 bg-secondary rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={send} aria-label="Send" className="h-10 w-10 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-glow"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
};