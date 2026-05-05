import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, ShoppingBag, X, Trash2, Paperclip } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { uploadAttachment } from "@/lib/uploads";

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
}

const CATEGORIES = ["books", "electronics", "notes", "hostel", "other"] as const;

export const MarketplaceScreen = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>("books");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("marketplace_listings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const rows = (data ?? []) as Listing[];
    const ids = Array.from(new Set(rows.map((r) => r.seller_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,name,avatar_url").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      rows.forEach((r) => { r.seller = map.get(r.seller_id) as any; });
    }
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!user) { toast.error("Sign in to sell"); return; }
    if (!title.trim()) { toast.error("Add a title"); return; }
    const p = Number(price) || 0;
    setBusy(true);
    const { error } = await supabase.from("marketplace_listings").insert({
      seller_id: user.id,
      title: title.trim().slice(0, 80),
      description: desc.trim().slice(0, 500),
      price: p,
      category,
      image_url: imageUrl,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setTitle(""); setDesc(""); setPrice(""); setCategory("books"); setImageUrl(null); setOpen(false);
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
    } catch (err: any) { toast.error(err.message ?? "Upload failed"); }
    finally { setUploading(false); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="animate-fade-in-up">
      <Header title="Marketplace" subtitle="Buy & sell on campus" />
      <div className="px-5 pt-4">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow"
        >
          <Plus className="h-4 w-4" /> Sell something
        </button>
      </div>

      <div className="px-5 mt-4 space-y-3 pb-24">
        {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-semibold mt-2">No listings yet</p>
            <p className="text-sm text-muted-foreground">Be the first to sell!</p>
          </div>
        )}
        {items.map((it) => (
          <article key={it.id} className="rounded-2xl bg-card p-4 shadow-soft border border-border/60 flex gap-3">
            {it.image_url ? (
              <img src={it.image_url} alt={it.title} className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground" /></div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{it.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{it.seller?.name ?? "Unknown"} · {formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}</p>
                </div>
                <span className="font-bold text-sm text-accent whitespace-nowrap">₹{it.price}</span>
              </div>
              {it.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.description}</p>}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold bg-secondary px-2 py-0.5 rounded-full">{it.category}</span>
                {user?.id === it.seller_id && (
                  <button onClick={() => remove(it.id)} className="ml-auto text-xs text-destructive flex items-center gap-1"><Trash2 className="h-3 w-3" /> Remove</button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">New listing</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" maxLength={80} className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none mb-2" />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Description" maxLength={500} className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none resize-none mb-2" />
            <div className="flex gap-2 mb-2">
              <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Price (₹)" className="flex-1 px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-3 rounded-2xl bg-secondary text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {imageUrl && (
              <div className="relative mb-2">
                <img src={imageUrl} alt="" className="rounded-xl max-h-40 w-full object-cover" />
                <button onClick={() => setImageUrl(null)} className="absolute top-1 right-1 h-7 w-7 rounded-full bg-foreground/70 text-background flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center disabled:opacity-50">
                <Paperclip className="h-5 w-5" />
              </button>
              <button onClick={submit} disabled={busy || uploading || !title.trim()} className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "List for sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
