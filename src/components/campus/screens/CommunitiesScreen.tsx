import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
    </div>
  );
};