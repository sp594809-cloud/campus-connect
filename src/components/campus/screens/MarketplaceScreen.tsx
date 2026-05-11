import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, ShoppingBag, X, Trash2, Paperclip, CheckCircle2, RotateCcw, Lock, Unlock, FileText, Video, Download, ExternalLink, BookOpen } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { uploadAttachment } from "@/lib/uploads";
import { fetchProfilesByIds } from "@/lib/api/profiles";
import { Eye, Flame, Sparkles } from "lucide-react";
import { ConfirmDialog } from "../ConfirmDialog";
import { cn } from "@/lib/utils";
import { PdfAiPanel } from "../PdfAiPanel";
import { Search } from "lucide-react";

interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  status: string;
  created_at: string;
  seller?: { name: string; avatar_url: string | null } | null;
  material?: StudyMaterial | null;
}
interface StudyMaterial {
  id: string;
  listing_id: string;
  seller_id: string;
  type: "PDF_Notes" | "Live_Masterclass";
  preview_text: string;
  has_pdf: boolean;
  has_meeting: boolean;
}

const PHYSICAL_CATEGORIES = ["books", "electronics", "notes", "hostel", "other"] as const;
const PDF_BYTES = 15 * 1024 * 1024;

export const MarketplaceScreen = () => {
  const { user } = useAuth();
  const enrollment = useMemo(() => (user?.email?.split("@")[0] ?? "STUDENT").toUpperCase(), [user]);
  const [view, setView] = useState<"browse" | "library">("browse");
  const [items, setItems] = useState<Listing[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set()); // material_ids
  const [loading, setLoading] = useState(true);
  // Filter transition: brief skeleton flicker when switching tabs / filters so the
  // change in result set is perceptible (counters change blindness).
  const [filtering, setFiltering] = useState(false);
  const [kindFilter, setKindFilter] = useState<"all" | "digital" | "physical">("all");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Form
  const [kind, setKind] = useState<"physical" | "digital">("physical");
  const [digitalType, setDigitalType] = useState<"PDF_Notes" | "Live_Masterclass">("PDF_Notes");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>("books");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [meetingLink, setMeetingLink] = useState("");
  const [previewText, setPreviewText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [confirmDel, setConfirmDel] = useState<Listing | null>(null);
  const [working, setWorking] = useState(false);

  // Field-level error state for inline contextual error handling.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const imageSlotRef = useRef<HTMLDivElement>(null);
  const pdfSlotRef = useRef<HTMLDivElement>(null);
  const meetingRef = useRef<HTMLInputElement>(null);

  const flagField = (key: string, message: string, ref?: React.RefObject<HTMLElement>) => {
    setFieldErrors((p) => ({ ...p, [key]: message }));
    requestAnimationFrame(() => {
      ref?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      ref?.current?.focus?.();
    });
  };
  const clearField = (key: string) =>
    setFieldErrors((p) => { if (!p[key]) return p; const n = { ...p }; delete n[key]; return n; });

  const triggerFilterFlicker = () => {
    setFiltering(true);
    window.setTimeout(() => setFiltering(false), 220);
  };

  // Viewer / unlocked content modal
  const [viewing, setViewing] = useState<Listing | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewSignedUrl, setViewSignedUrl] = useState<string | null>(null);
  const [viewMeetingLink, setViewMeetingLink] = useState<string | null>(null);

  // Focused-transition state: which material just unlocked (for morph + saliency dim)
  const [justUnlockedId, setJustUnlockedId] = useState<string | null>(null);

  // Semantic library search (pgvector)
  const [librarySearch, setLibrarySearch] = useState("");
  const [librarySearching, setLibrarySearching] = useState(false);
  const [semanticHits, setSemanticHits] = useState<{ material_id: string; similarity: number }[] | null>(null);

  const runSemanticSearch = async () => {
    const q = librarySearch.trim();
    if (!q) { setSemanticHits(null); return; }
    setLibrarySearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("material-ai", {
        body: { action: "search", query: q },
      });
      if (error) throw error;
      const r = ((data as { results?: { material_id: string; similarity: number }[] })?.results) ?? [];
      setSemanticHits(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally { setLibrarySearching(false); }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = (data ?? []) as Listing[];
    const ids = Array.from(new Set(rows.map((r) => r.seller_id)));
    try {
      const profs = await fetchProfilesByIds(ids);
      const map = new Map(profs.map((p) => [p.id, p]));
      rows.forEach((r) => { r.seller = map.get(r.seller_id) ?? null; });
    } catch (err) { console.error("[Marketplace] sellers", err); }

    // Materials for digital listings
    const listingIds = rows.filter((r) => r.category === "digital").map((r) => r.id);
    if (listingIds.length) {
      const { data: mats } = await supabase
        .from("study_materials")
        .select("*")
        .in("listing_id", listingIds);
      const mmap = new Map((mats ?? []).map((m) => [m.listing_id, m as StudyMaterial]));
      rows.forEach((r) => { r.material = mmap.get(r.id) ?? null; });
    }
    setItems(rows);

    if (user) {
      const { data: purchases } = await supabase
        .from("material_purchases")
        .select("material_id")
        .eq("buyer_id", user.id);
      setUnlocked(new Set((purchases ?? []).map((p) => p.material_id as string)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const resetForm = () => {
    setTitle(""); setDesc(""); setPrice(""); setCategory("books"); setImageUrl(null);
    setKind("physical"); setDigitalType("PDF_Notes"); setPdfPath(null); setPdfName("");
    setMeetingLink(""); setPreviewText("");
  };

  const submit = async () => {
    if (!user) { toast.error("Sign in to sell"); return; }
    setFieldErrors({});
    if (!title.trim()) { flagField("title", "Title is required", titleRef); return; }
    const p = Number(price);
    if (!price.trim() || isNaN(p) || p < 0) { flagField("price", "Enter a valid price (0 for free)", priceRef); return; }

    if (kind === "physical") {
      if (!imageUrl) { flagField("image", "A product photo is required", imageSlotRef as React.RefObject<HTMLElement>); return; }
    } else {
      if (digitalType === "PDF_Notes" && !pdfPath) { flagField("pdf", "Upload the PDF you want to sell", pdfSlotRef as React.RefObject<HTMLElement>); return; }
      if (digitalType === "Live_Masterclass" && !meetingLink.trim()) { flagField("meeting", "Paste the Zoom / Meet link", meetingRef); return; }
    }

    setBusy(true);
    const { data: listing, error } = await supabase.from("marketplace_listings").insert({
      seller_id: user.id,
      title: title.trim().slice(0, 80),
      description: desc.trim().slice(0, 500),
      price: p,
      category: kind === "digital" ? "digital" : category,
      image_url: kind === "digital" ? null : imageUrl,
    }).select("id").single();
    if (error || !listing) { setBusy(false); toast.error(error?.message ?? "Failed"); return; }

    if (kind === "digital") {
      const { data: mat, error: mErr } = await supabase.from("study_materials").insert({
        listing_id: listing.id,
        seller_id: user.id,
        type: digitalType,
        preview_text: previewText.trim().slice(0, 240),
        has_pdf: digitalType === "PDF_Notes",
        has_meeting: digitalType === "Live_Masterclass",
      }).select("id").single();
      if (mErr || !mat) {
        await supabase.from("marketplace_listings").delete().eq("id", listing.id);
        setBusy(false); toast.error(mErr?.message ?? "Failed"); return;
      }
      const { error: sErr } = await supabase.from("study_material_secrets").insert({
        material_id: mat.id,
        pdf_path: digitalType === "PDF_Notes" ? pdfPath : null,
        meeting_link: digitalType === "Live_Masterclass" ? meetingLink.trim() : null,
      });
      if (sErr) { setBusy(false); toast.error(sErr.message); return; }
    }

    setBusy(false);
    resetForm();
    setOpen(false);
    toast.success("Listed!");
    load();
  };

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Image only"); return; }
    setUploading(true);
    try {
      const r = await uploadAttachment(file, "post-media", user.id);
      if (r) setImageUrl(r.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const pickPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !user) return;
    if (file.type !== "application/pdf") { toast.error("PDF only"); return; }
    if (file.size > PDF_BYTES) { toast.error("Max 15MB"); return; }
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("study-materials").upload(path, file, {
        contentType: "application/pdf", upsert: false,
      });
      if (error) throw error;
      setPdfPath(path); setPdfName(file.name);
      toast.success("PDF uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const remove = async () => {
    if (!confirmDel) return;
    setWorking(true);
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", confirmDel.id);
    setWorking(false);
    if (error) { toast.error(error.message); return; }
    setItems((p) => p.filter((x) => x.id !== confirmDel.id));
    setConfirmDel(null);
    toast.success("Listing removed");
  };

  const toggleSold = async (it: Listing) => {
    const next = it.status === "sold" ? "available" : "sold";
    setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: next } : x)));
    const { error } = await supabase.from("marketplace_listings").update({ status: next }).eq("id", it.id);
    if (error) {
      toast.error(error.message);
      setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: it.status } : x)));
    }
  };

  const unlock = async (it: Listing) => {
    if (!user || !it.material) return;
    if (it.material.seller_id === user.id) {
      toast.message("This is your own listing.");
      return;
    }
    // Optimistic-locking buy: atomic on the server. Prevents two students
    // from racing on the last available item.
    const { error } = await supabase.rpc("purchase_material", {
      _material_id: it.material.id,
    });
    if (error) { toast.error(error.message); return; }
    const matId = it.material.id;
    // Focused transition: morph button in place, dim siblings briefly, then open content.
    setJustUnlockedId(matId);
    setUnlocked((s) => new Set(s).add(matId));
    // Stagger: morph first (340ms), then reveal content (prevents simultaneous change).
    setTimeout(() => openContent(it), 360);
    setTimeout(() => setJustUnlockedId((cur) => (cur === matId ? null : cur)), 1600);
  };

  const openContent = async (it: Listing) => {
    if (!it.material) return;
    setViewing(it); setViewLoading(true); setViewSignedUrl(null); setViewMeetingLink(null);
    try {
      const { data, error } = await supabase.functions.invoke("get-material-url", {
        body: { material_id: it.material.id },
      });
      if (error) throw error;
      setViewSignedUrl((data as { signed_url?: string })?.signed_url ?? null);
      setViewMeetingLink((data as { meeting_link?: string })?.meeting_link ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open");
      setViewing(null);
    } finally { setViewLoading(false); }
  };

  const libraryItems = items.filter((it) => it.material && unlocked.has(it.material.id));
  const semanticOrder = semanticHits && view === "library"
    ? new Map(semanticHits.map((h, i) => [h.material_id, i]))
    : null;
  const baseList = view === "browse"
    ? items
    : (semanticOrder
        ? libraryItems
            .filter((it) => it.material && semanticOrder.has(it.material.id))
            .sort((a, b) => (semanticOrder.get(a.material!.id)! - semanticOrder.get(b.material!.id)!))
        : libraryItems);
  const visible = baseList.filter((it) => {
    if (kindFilter === "all") return true;
    if (kindFilter === "digital") return it.category === "digital";
    return it.category !== "digital";
  });

  return (
    <div className="animate-fade-in-up">
      <Header title="Marketplace" subtitle="Buy & sell on campus" />
      {/* Section nav with animated active underline (high saliency) */}
      <div className="px-5 pt-3 flex items-center gap-1 relative">
        {([
          { id: "browse" as const, label: "Browse", icon: null },
          { id: "library" as const, label: "My Classroom", icon: <BookOpen className="h-3 w-3" /> },
        ]).map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { if (view !== t.id) { setView(t.id); triggerFilterFlicker(); } }}
              className={cn(
                "relative text-xs font-bold px-3 py-2 rounded-full inline-flex items-center gap-1 transition-all duration-300",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.icon}{t.label}
              <span
                className={cn(
                  "absolute left-2 right-2 -bottom-0.5 h-[3px] rounded-full bg-gradient-cta transition-all duration-300 origin-center",
                  active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                )}
              />
            </button>
          );
        })}
        <div className="ml-auto badge-social-proof glow-warning inline-flex items-center gap-2 text-[11px] font-bold rounded-full px-3 py-1.5">
          <Eye className="h-3 w-3" /> {12 + (new Date().getHours() % 9) * 3} live
        </div>
      </div>

      {/* Category filter chips */}
      <div className="px-5 pt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {([
          { id: "all" as const, label: "All" },
          { id: "digital" as const, label: "Digital" },
          { id: "physical" as const, label: "Physical" },
        ]).map((c) => {
          const active = kindFilter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => { if (kindFilter !== c.id) { setKindFilter(c.id); triggerFilterFlicker(); } }}
              className={cn(
                "text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-300",
                active ? "bg-foreground text-background scale-105 shadow-soft" : "bg-secondary text-muted-foreground"
              )}
            >{c.label}</button>
          );
        })}
      </div>
      {view === "browse" && (
        <div className="px-5 pt-4">
          <button
            onClick={() => setOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow"
          >
            <Plus className="h-4 w-4" /> Sell something
          </button>
        </div>
      )}
      {view === "library" && (
        <div className="px-5 pt-4">
          <form
            onSubmit={(e) => { e.preventDefault(); runSemanticSearch(); }}
            className="flex items-center gap-2 bg-secondary rounded-2xl px-3 py-2"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={librarySearch}
              onChange={(e) => { setLibrarySearch(e.target.value); if (!e.target.value) setSemanticHits(null); }}
              placeholder="Search inside your notes — e.g. ‘second law of thermodynamics’"
              className="flex-1 bg-transparent text-xs outline-none"
            />
            {librarySearching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : semanticHits ? (
              <button type="button" onClick={() => { setLibrarySearch(""); setSemanticHits(null); }} className="text-[10px] font-bold text-muted-foreground">Clear</button>
            ) : (
              <button type="submit" className="text-[10px] font-bold text-primary">Search</button>
            )}
          </form>
          {semanticHits && (
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              {semanticHits.length} semantic match{semanticHits.length === 1 ? "" : "es"} across your purchased notes
            </p>
          )}
        </div>
      )}

      <div className="px-5 mt-4 space-y-3 pb-24">
        {(loading || filtering) && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl glass-card p-4 flex gap-3 shadow-soft animate-fade-in-up" style={{ animationDuration: "200ms" }}>
                <div className="h-20 w-20 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !filtering && visible.length === 0 && (
          <div className="text-center py-12">
            {view === "library" ? <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" /> : <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />}
            <p className="font-semibold mt-2">{view === "library" ? "Nothing unlocked yet" : "No listings yet"}</p>
            <p className="text-sm text-muted-foreground">{view === "library" ? "Unlock notes or masterclasses to see them here." : "Be the first to sell!"}</p>
          </div>
        )}
        {!filtering && visible.map((it, idx) => {
          const mat = it.material;
          const isDigital = it.category === "digital" && mat;
          const isUnlocked = isDigital && (unlocked.has(mat!.id) || mat!.seller_id === user?.id);
          const isFocus = isDigital && justUnlockedId === mat!.id;
          const dimSibling = justUnlockedId !== null && !isFocus;
          return (
            <article
              key={it.id}
              style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
              className={cn(
                "relative rounded-2xl glass-card p-4 shadow-soft flex gap-3 animate-fade-in-up transition-all duration-500",
                it.status === "sold" && "opacity-95",
                dimSibling && "opacity-40 blur-[1px] scale-[0.99]",
                isFocus && "ring-2 ring-success/70 shadow-glow scale-[1.01]"
              )}
            >
              {it.status === "sold" && (
                <span className="absolute -top-2 right-3 z-10 px-2.5 py-0.5 rounded-full badge-social-proof glow-warning text-[10px] font-black uppercase tracking-[0.15em] inline-flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Sold
                </span>
              )}
              {(() => {
                if (it.status === "sold") return null;
                const ageMin = (Date.now() - new Date(it.created_at).getTime()) / 60000;
                if (ageMin < 60) return (
                  <span className="absolute -top-2 -left-2 z-10 px-2 py-0.5 rounded-full bg-success text-success-foreground glow-success text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Just listed
                  </span>
                );
                if (ageMin < 60 * 24) return (
                  <span className="absolute -top-2 -left-2 z-10 px-2 py-0.5 rounded-full badge-social-proof glow-warning text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <Flame className="h-2.5 w-2.5" /> Hot
                  </span>
                );
                return null;
              })()}

              {/* Cover */}
              {isDigital ? (
                <div className={cn(
                  "h-20 w-20 rounded-xl flex items-center justify-center text-primary-foreground relative overflow-hidden",
                  mat!.type === "PDF_Notes" ? "bg-gradient-to-br from-fuchsia-500 to-violet-600" : "bg-gradient-to-br from-cyan-500 to-blue-600"
                )}>
                  {mat!.type === "PDF_Notes" ? <FileText className="h-7 w-7" /> : <Video className="h-7 w-7" />}
                  {!isUnlocked && (
                    <div className="absolute inset-0 backdrop-blur-[3px] bg-foreground/20 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {it.status === "sold" && (
                    <div className="absolute inset-0 bg-destructive/85 flex items-center justify-center rotate-[-8deg]">
                      <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase border-2 border-white px-1.5 py-0.5 rounded">Sold out</span>
                    </div>
                  )}
                </div>
              ) : it.image_url ? (
                <div className="relative h-20 w-20">
                  <img src={it.image_url} alt={it.title} className={cn("h-20 w-20 rounded-xl object-cover", it.status === "sold" && "grayscale")} />
                  {it.status === "sold" && (
                    <div className="absolute inset-0 bg-destructive/75 rounded-xl flex items-center justify-center rotate-[-8deg]">
                      <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase border-2 border-white px-1.5 py-0.5 rounded">Sold out</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground" /></div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn("font-semibold text-sm truncate", it.status === "sold" && "line-through text-muted-foreground")}>{it.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{it.seller?.name ?? "Unknown"} · {formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}</p>
                  </div>
                  <span className="font-bold text-sm text-accent whitespace-nowrap">{it.price === 0 ? "Free" : `₹${it.price}`}</span>
                </div>
                {isDigital && mat!.preview_text && !isUnlocked && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 select-none" style={{ filter: "blur(2.5px)" }}>{mat!.preview_text}</p>
                )}
                {isDigital && mat!.preview_text && isUnlocked && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mat!.preview_text}</p>
                )}
                {!isDigital && it.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.description}</p>}

                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-secondary px-2 py-0.5 rounded-full">
                    {isDigital ? (mat!.type === "PDF_Notes" ? "📄 Notes" : "🎥 Masterclass") : it.category}
                  </span>

                  {isDigital && !isUnlocked && (
                    <button
                      onClick={() => unlock(it)}
                      className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-hero text-primary-foreground font-bold text-[11px] shadow-glow transition-all duration-300 hover:scale-[1.03]"
                    >
                      <Unlock className="h-3 w-3" /> Unlock {it.price > 0 ? `₹${it.price}` : "free"}
                    </button>
                  )}
                  {isDigital && isUnlocked && (
                    <button
                      key={isFocus ? "morph" : "static"}
                      onClick={() => openContent(it)}
                      className={cn(
                        "ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-success text-success-foreground font-bold text-[11px] transition-all duration-300 animate-scale-in",
                        isFocus && "glow-success"
                      )}
                    >
                      {isFocus ? (
                        <><CheckCircle2 className="h-3 w-3" /> Unlocked</>
                      ) : mat!.type === "PDF_Notes" ? (
                        <><Download className="h-3 w-3" /> Open notes</>
                      ) : (
                        <><ExternalLink className="h-3 w-3" /> Join class</>
                      )}
                    </button>
                  )}

                  {!isDigital && user?.id === it.seller_id && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={() => toggleSold(it)}
                        className={cn("text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold transition-smooth",
                          it.status === "sold" ? "bg-secondary text-foreground hover:bg-secondary/70" : "badge-social-proof glow-warning")}
                      >
                        {it.status === "sold" ? <><RotateCcw className="h-3 w-3" /> Reopen</> : <><CheckCircle2 className="h-3 w-3" /> Mark sold</>}
                      </button>
                      <button onClick={() => setConfirmDel(it)} aria-label="Remove" className="text-xs text-destructive flex items-center gap-1 px-2 py-1 rounded-full hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {isDigital && user?.id === it.seller_id && (
                    <button onClick={() => setConfirmDel(it)} aria-label="Remove" className="text-xs text-destructive flex items-center gap-1 px-2 py-1 rounded-full hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete this listing?"
        description="This is permanent."
        confirmLabel="Delete"
        destructive
        busy={working}
        onCancel={() => setConfirmDel(null)}
        onConfirm={remove}
      />

      {/* Sell modal */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">New listing</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 p-1 bg-secondary rounded-2xl">
              <button onClick={() => setKind("physical")} className={cn("py-2 rounded-xl text-xs font-bold", kind === "physical" ? "bg-card shadow-soft" : "text-muted-foreground")}>Physical item</button>
              <button onClick={() => setKind("digital")} className={cn("py-2 rounded-xl text-xs font-bold", kind === "digital" ? "bg-card shadow-soft" : "text-muted-foreground")}>Digital · Notes/Class</button>
            </div>

            <div className="mb-2">
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => { setTitle(e.target.value); clearField("title"); }}
                placeholder="Title"
                maxLength={80}
                aria-invalid={!!fieldErrors.title}
                className={cn(
                  "w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none transition-all duration-300",
                  fieldErrors.title && "ring-2 ring-destructive bg-destructive/5 animate-scale-in"
                )}
              />
              {fieldErrors.title && <p className="text-[11px] font-semibold text-destructive mt-1 ml-1">⚠ {fieldErrors.title}</p>}
            </div>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Description" maxLength={500} className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none resize-none mb-2" />

            <div className="flex gap-2 mb-1">
              <input
                ref={priceRef}
                value={price}
                onChange={(e) => { setPrice(e.target.value.replace(/[^0-9.]/g, "")); clearField("price"); }}
                placeholder="Price ₹ (0 = free)"
                aria-invalid={!!fieldErrors.price}
                className={cn(
                  "flex-1 px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none transition-all duration-300",
                  fieldErrors.price && "ring-2 ring-destructive bg-destructive/5 animate-scale-in"
                )}
              />
              {kind === "physical" && (
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-3 rounded-2xl bg-secondary text-sm">
                  {PHYSICAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
            {fieldErrors.price && <p className="text-[11px] font-semibold text-destructive mb-2 ml-1">⚠ {fieldErrors.price}</p>}

            {kind === "physical" && (
              <>
                <div
                  ref={imageSlotRef}
                  className={cn(
                    "rounded-2xl mb-2 transition-all duration-300",
                    fieldErrors.image && "ring-2 ring-destructive p-2 bg-destructive/5 animate-scale-in"
                  )}
                >
                  {!imageUrl && <p className="text-xs text-muted-foreground">📸 Product image required.</p>}
                  {imageUrl && (
                    <div className="relative">
                      <img src={imageUrl} alt="" className="rounded-xl max-h-40 w-full object-cover" />
                      <button onClick={() => setImageUrl(null)} className="absolute top-1 right-1 h-7 w-7 rounded-full bg-foreground/70 text-background flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                  {fieldErrors.image && <p className="text-[11px] font-semibold text-destructive mt-1">⚠ {fieldErrors.image}</p>}
                </div>
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
                  <button onClick={() => { clearField("image"); fileRef.current?.click(); }} disabled={uploading} className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center disabled:opacity-50">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button onClick={submit} disabled={busy || uploading} className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-300">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "List for sale"}
                  </button>
                </div>
              </>
            )}

            {kind === "digital" && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2 p-1 bg-secondary rounded-2xl">
                  <button onClick={() => setDigitalType("PDF_Notes")} className={cn("py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1", digitalType === "PDF_Notes" ? "bg-card shadow-soft" : "text-muted-foreground")}>
                    <FileText className="h-3.5 w-3.5" /> PDF Notes
                  </button>
                  <button onClick={() => setDigitalType("Live_Masterclass")} className={cn("py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1", digitalType === "Live_Masterclass" ? "bg-card shadow-soft" : "text-muted-foreground")}>
                    <Video className="h-3.5 w-3.5" /> Live class
                  </button>
                </div>

                <textarea value={previewText} onChange={(e) => setPreviewText(e.target.value)} maxLength={240} rows={2} placeholder="Public preview snippet (visible blurred to non-buyers)" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none resize-none mb-2" />

                {digitalType === "PDF_Notes" && (
                  <div
                    ref={pdfSlotRef}
                    className={cn(
                      "rounded-2xl mb-2 transition-all duration-300",
                      fieldErrors.pdf && "ring-2 ring-destructive p-1.5 bg-destructive/5 animate-scale-in"
                    )}
                  >
                    <input ref={pdfRef} type="file" accept="application/pdf" hidden onChange={(e) => { clearField("pdf"); pickPdf(e); }} />
                    <button onClick={() => pdfRef.current?.click()} disabled={uploading} className="w-full py-3 rounded-2xl bg-secondary text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                      {pdfPath ? `✓ ${pdfName}` : "Upload PDF (max 15MB)"}
                    </button>
                    {fieldErrors.pdf && <p className="text-[11px] font-semibold text-destructive mt-1 ml-1">⚠ {fieldErrors.pdf}</p>}
                  </div>
                )}
                {digitalType === "Live_Masterclass" && (
                  <div className="mb-2">
                    <input
                      ref={meetingRef}
                      value={meetingLink}
                      onChange={(e) => { setMeetingLink(e.target.value); clearField("meeting"); }}
                      placeholder="Zoom / Google Meet link"
                      aria-invalid={!!fieldErrors.meeting}
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none transition-all duration-300",
                        fieldErrors.meeting && "ring-2 ring-destructive bg-destructive/5 animate-scale-in"
                      )}
                    />
                    {fieldErrors.meeting && <p className="text-[11px] font-semibold text-destructive mt-1 ml-1">⚠ {fieldErrors.meeting}</p>}
                  </div>
                )}

                <button onClick={submit} disabled={busy || uploading} className="w-full py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-300">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish material"}
                </button>
                <p className="text-[11px] text-muted-foreground mt-2">🔒 Buyers see a blurred preview. The PDF / link is only revealed after they unlock.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unlocked content viewer */}
      {viewing && viewing.material && (
        <div className="fixed inset-0 z-[110] bg-foreground/70 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in-up" style={{ animationDuration: "300ms" }} onClick={() => setViewing(null)}>
          <div
            className="bg-card rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-elevated animate-scale-in"
            style={{ animationDuration: "300ms" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{viewing.title}</p>
                <p className="text-[11px] text-muted-foreground">Licensed to {enrollment} · do not reshare</p>
              </div>
              <button onClick={() => setViewing(null)} className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>

            <div className="relative flex-1 overflow-auto bg-secondary">
              {viewLoading && (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              )}
              {!viewLoading && viewing.material.type === "PDF_Notes" && viewSignedUrl && (
                <div className="relative w-full h-[70vh]">
                  <iframe src={viewSignedUrl} className="absolute inset-0 w-full h-full" title="PDF" />
                  {/* Watermark overlay */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-6 select-none">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-center">
                          <span className="text-foreground/15 text-xs font-bold rotate-[-30deg] whitespace-nowrap">{enrollment}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!viewLoading && viewing.material.type === "Live_Masterclass" && viewMeetingLink && (
                <div className="p-8 flex flex-col items-center gap-4 text-center">
                  <Video className="h-12 w-12 text-accent" />
                  <p className="font-bold">Your masterclass link is ready</p>
                  <p className="text-xs text-muted-foreground break-all px-4">{viewMeetingLink}</p>
                  <a href={viewMeetingLink} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow inline-flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" /> Join now
                  </a>
                </div>
              )}
            </div>

            {viewing.material.type === "PDF_Notes" && viewSignedUrl && (
              <div className="p-3 border-t flex justify-end">
                <a href={viewSignedUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-bold inline-flex items-center gap-2">
                  <Download className="h-3 w-3" /> Open in new tab
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
