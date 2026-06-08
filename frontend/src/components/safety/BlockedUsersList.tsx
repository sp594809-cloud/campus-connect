import { useEffect, useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface BlockedRow {
  blocked_id: string;
  created_at: string;
  profile: { id: string; name: string; avatar_url: string | null } | null;
}

export const BlockedUsersList = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: blocks, error } = await supabase
      .from("user_blocks")
      .select("blocked_id, created_at")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const ids = (blocks ?? []).map((b) => b.blocked_id);
    let profMap = new Map<string, { id: string; name: string; avatar_url: string | null }>();
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, name, avatar_url").in("id", ids);
      profMap = new Map((profs ?? []).map((p) => [p.id, p as { id: string; name: string; avatar_url: string | null }]));
    }
    setRows((blocks ?? []).map((b) => ({ ...b, profile: profMap.get(b.blocked_id) ?? null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const unblock = async (blockedId: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_blocks").delete().eq("blocker_id", user.id).eq("blocked_id", blockedId);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.filter((r) => r.blocked_id !== blockedId));
    toast.success("Unblocked");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Ban className="h-5 w-5 text-destructive" />
        <h3 className="font-bold text-sm">Blocked users</h3>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {!loading && rows.length === 0 && (
        <p className="text-xs text-muted-foreground">You haven't blocked anyone.</p>
      )}
      <div className="space-y-2">
        {rows.map((r) => {
          const name = r.profile?.name ?? "Unknown user";
          const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div key={r.blocked_id} className="flex items-center gap-3 p-2 rounded-2xl bg-secondary">
              {r.profile?.avatar_url ? (
                <img src={r.profile.avatar_url} alt={name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{initials}</div>
              )}
              <p className="flex-1 text-sm font-semibold truncate">{name}</p>
              <button
                onClick={() => unblock(r.blocked_id)}
                className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold hover:bg-muted transition-smooth"
              >
                Unblock
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};