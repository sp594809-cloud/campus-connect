import { useEffect, useState } from "react";
import { Users, Plus, X } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ALL_INTERESTS } from "@/data/constants";

interface Community {
  id: string;
  name: string;
  description: string;
  interest: string;
  emoji: string;
  color: string;
  member_count: number;
}

export const CommunitiesScreen = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", interest: ALL_INTERESTS[0], emoji: "✨", color: "from-violet-500 to-fuchsia-500" });
  const [submitting, setSubmitting] = useState(false);

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

  const myCommunities = communities.filter((c) => joined[c.id]);

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
              <div key={c.id} className={cn("min-w-[140px] rounded-2xl p-3 text-white shadow-soft bg-gradient-to-br", c.color)}>
                <div className="text-2xl">{c.emoji}</div>
                <p className="text-sm font-bold mt-1 leading-tight">{c.name}</p>
                <p className="text-[11px] opacity-80 mt-0.5">{c.member_count} members</p>
              </div>
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
              <button onClick={() => toggle(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-smooth",
                joined[c.id] ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground hover:shadow-glow")}>
                {joined[c.id] ? "Joined" : "Join"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in-up" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated animate-scale-in space-y-3" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
};