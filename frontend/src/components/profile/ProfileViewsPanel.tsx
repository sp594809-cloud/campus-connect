import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProfilesByIds, type MiniProfile } from "@/lib/api/profiles";
import { avatarFor } from "@/hooks/useProfiles";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface View { id: string; viewer_id: string; viewed_at: string; source: string }

export const ProfileViewsPanel = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<7 | 30>(7);
  const [views, setViews] = useState<View[]>([]);
  const [viewers, setViewers] = useState<Record<string, MiniProfile>>({});
  const [loading, setLoading] = useState(true);
  const incognito = (profile as unknown as { views_incognito?: boolean })?.views_incognito;

  useEffect(() => {
    if (!user || incognito) { setLoading(false); return; }
    let alive = true;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("profile_views")
        .select("id,viewer_id,viewed_at,source")
        .gte("viewed_at", since)
        .order("viewed_at", { ascending: false })
        .limit(50);
      if (!alive) return;
      const rows = (data ?? []) as View[];
      setViews(rows);
      const ids = Array.from(new Set(rows.map((r) => r.viewer_id)));
      const profs = ids.length ? await fetchProfilesByIds(ids) : [];
      const map: Record<string, MiniProfile> = {};
      profs.forEach((p) => { map[p.id] = p; });
      if (alive) { setViewers(map); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [user?.id, range, incognito]);

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {incognito ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-primary" />}
          <h3 className="font-bold text-sm">Who viewed your profile</h3>
        </div>
        {!incognito && (
          <div className="flex bg-secondary rounded-full p-0.5 text-[11px] font-semibold">
            {[7, 30].map((d) => (
              <button key={d} onClick={() => setRange(d as 7 | 30)} className={cn("px-2.5 py-1 rounded-full transition-smooth", range === d ? "bg-primary text-primary-foreground" : "text-secondary-foreground")}>{d}d</button>
            ))}
          </div>
        )}
      </div>
      {incognito ? (
        <p className="text-xs text-muted-foreground">Incognito browsing is on. Turn it off in Privacy to see who viewed you.</p>
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : views.length === 0 ? (
        <p className="text-xs text-muted-foreground">No views yet. Share your profile to get noticed.</p>
      ) : (
        <ul className="space-y-2">
          {views.map((v) => {
            const viewer = viewers[v.viewer_id];
            return (
              <li key={v.id}>
                <button onClick={() => viewer && navigate(`/u/${viewer.id}`)} className="w-full flex items-center gap-3 rounded-2xl p-2 hover:bg-secondary transition-smooth text-left">
                  <img src={viewer ? avatarFor(viewer) : avatarFor({ avatar_url: null, name: "?" })} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{viewer?.name ?? "Someone"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{viewer?.branch ?? "—"} · {viewer?.year ?? "—"} · {formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true })}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};