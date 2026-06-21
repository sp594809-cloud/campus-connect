import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft, Ban, Eye, EyeOff, Flag, Loader2, RotateCcw, Search, Shield, ShieldAlert, Trash2, UserCog, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStaffRole, useAdminRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

type Tab = "reports" | "hidden" | "bans" | "roles";

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  content_type: string;
  content_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  resolution_note: string | null;
}

interface BanRow {
  id: string;
  user_id: string;
  scope: string;
  community_id: string | null;
  reason: string;
  permanent: boolean;
  expires_at: string | null;
  created_at: string;
}

interface ProfileLite {
  id: string;
  name: string;
  branch: string | null;
  year: string | null;
}

const TABS: { id: Tab; label: string; icon: typeof Flag }[] = [
  { id: "reports", label: "Open reports", icon: Flag },
  { id: "hidden", label: "Auto-hidden", icon: EyeOff },
  { id: "bans", label: "Active bans", icon: Ban },
  { id: "roles", label: "Roles", icon: UserCog },
];

const AdminModeration = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isStaff, isAdmin, loading: roleLoading } = useStaffRole();
  const [tab, setTab] = useState<Tab>("reports");

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) navigate("/auth", { replace: true });
    else if (!isStaff) navigate("/campus", { replace: true });
  }, [authLoading, roleLoading, user, isStaff, navigate]);

  if (authLoading || roleLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isStaff) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
      <div className="mx-auto max-w-2xl min-h-screen bg-background shadow-elevated">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/60 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-base">Moderation</h1>
          </div>
        </header>

        <nav className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-border/60">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-smooth",
                tab === id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </nav>

        <div className="p-4">
          {tab === "reports" && <ReportsTab />}
          {tab === "hidden" && <HiddenTab />}
          {tab === "bans" && <BansTab />}
          {tab === "roles" && <RolesTab canEdit={isAdmin} />}
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── Reports ───────────────────────── */

const ReportsTab = () => {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState<{ userId: string; reportId?: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("id,reporter_id,reported_user_id,content_type,content_id,reason,details,status,created_at,resolution_note")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as ReportRow[];
    setRows(list);
    const ids = Array.from(new Set(list.flatMap((r) => [r.reporter_id, r.reported_user_id].filter(Boolean) as string[])));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id,name,branch,year").in("id", ids);
      const map: Record<string, ProfileLite> = {};
      (ps ?? []).forEach((p) => { map[(p as ProfileLite).id] = p as ProfileLite; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, ReportRow[]>();
    rows.forEach((r) => {
      const key = `${r.content_type}:${r.content_id}`;
      m.set(key, [...(m.get(key) ?? []), r]);
    });
    return Array.from(m.entries()).map(([k, list]) => ({ key: k, list }));
  }, [rows]);

  const resolveGroup = async (list: ReportRow[], status: "dismissed" | "actioned", note: string) => {
    const ids = list.map((r) => r.id);
    const { error } = await supabase
      .from("reports")
      .update({ status, resolution_note: note, reviewed_at: new Date().toISOString() })
      .in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(status === "actioned" ? "Content removed" : "Reports dismissed");
    load();
  };

  const hideContent = async (r: ReportRow) => {
    const table = TABLE_FOR[r.content_type];
    if (!table) return toast.error("Unknown content type");
    const { error } = await supabase
      .from(table as never)
      .update({ hidden_at: new Date().toISOString(), hidden_reason: "Removed by moderator" } as never)
      .eq("id", r.content_id);
    if (error) return toast.error(error.message);
    const sameTarget = rows.filter((x) => x.content_type === r.content_type && x.content_id === r.content_id);
    await resolveGroup(sameTarget, "actioned", "Content hidden");
  };

  if (loading) return <Loader />;
  if (grouped.length === 0) return <Empty label="No open reports — you're caught up." />;

  return (
    <>
      <div className="space-y-3">
        {grouped.map(({ key, list }) => {
          const first = list[0];
          const reportedUser = first.reported_user_id ? profiles[first.reported_user_id] : null;
          return (
            <article key={key} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center"><Flag className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold capitalize">{first.content_type} · {list.length} report{list.length > 1 ? "s" : ""}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {reportedUser ? <>By <span className="font-semibold">{reportedUser.name}</span> · </> : null}
                    {formatDistanceToNow(new Date(first.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <ContentPreview type={first.content_type} id={first.content_id} />

              <div className="space-y-1.5">
                {list.map((r) => {
                  const reporter = profiles[r.reporter_id];
                  return (
                    <div key={r.id} className="text-xs p-2 rounded-xl bg-secondary">
                      <p><span className="font-semibold">{reporter?.name ?? "Someone"}</span>: <span className="capitalize">{r.reason}</span></p>
                      {r.details && <p className="text-muted-foreground mt-0.5">{r.details}</p>}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => resolveGroup(list, "dismissed", "No action needed")} className="flex-1 min-w-[120px] py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold">Dismiss</button>
                <button onClick={() => hideContent(first)} className="flex-1 min-w-[120px] py-2 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1"><EyeOff className="h-3.5 w-3.5" /> Hide content</button>
                {first.reported_user_id && (
                  <button onClick={() => setBanTarget({ userId: first.reported_user_id!, reportId: first.id })} className="flex-1 min-w-[120px] py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center gap-1"><Ban className="h-3.5 w-3.5" /> Ban user</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {banTarget && (
        <BanDialog
          userId={banTarget.userId}
          onClose={() => setBanTarget(null)}
          onBanned={async () => {
            const g = rows.filter((x) => x.reported_user_id === banTarget.userId);
            if (g.length) await resolveGroup(g, "actioned", "User banned");
            setBanTarget(null);
            load();
          }}
        />
      )}
    </>
  );
};

const TABLE_FOR: Record<string, string> = {
  post: "posts",
  community_message: "community_messages",
  listing: "marketplace_listings",
  message: "messages",
};

const ContentPreview = ({ type, id }: { type: string; id: string }) => {
  const [text, setText] = useState<string>("Loading…");
  useEffect(() => {
    const table = TABLE_FOR[type];
    if (!table) { setText("(unknown)"); return; }
    const col = type === "listing" ? "title,description" : "content";
    supabase.from(table as never).select(`id,${col}`).eq("id", id).maybeSingle().then(({ data }) => {
      const row = data as unknown as Record<string, string> | null;
      if (!row) { setText("(content deleted)"); return; }
      setText(type === "listing" ? `${row.title} — ${row.description ?? ""}` : (row.content ?? "(empty)"));
    });
  }, [type, id]);
  return <p className="text-sm bg-muted/50 rounded-xl p-3 line-clamp-4">{text}</p>;
};

/* ───────────────────────── Hidden content ───────────────────────── */

const HiddenTab = () => {
  const [rows, setRows] = useState<{ table: string; id: string; preview: string; hidden_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [p, c, l] = await Promise.all([
      supabase.from("posts").select("id,content,hidden_at").not("hidden_at", "is", null).order("hidden_at", { ascending: false }).limit(100),
      supabase.from("community_messages").select("id,content,hidden_at").not("hidden_at", "is", null).order("hidden_at", { ascending: false }).limit(100),
      supabase.from("marketplace_listings").select("id,title,hidden_at").not("hidden_at", "is", null).order("hidden_at", { ascending: false }).limit(100),
    ]);
    const combined = [
      ...((p.data ?? []) as { id: string; content: string; hidden_at: string }[]).map((r) => ({ table: "posts", id: r.id, preview: r.content, hidden_at: r.hidden_at })),
      ...((c.data ?? []) as { id: string; content: string; hidden_at: string }[]).map((r) => ({ table: "community_messages", id: r.id, preview: r.content, hidden_at: r.hidden_at })),
      ...((l.data ?? []) as { id: string; title: string; hidden_at: string }[]).map((r) => ({ table: "marketplace_listings", id: r.id, preview: r.title, hidden_at: r.hidden_at })),
    ].sort((a, b) => (a.hidden_at < b.hidden_at ? 1 : -1));
    setRows(combined);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const restore = async (table: string, id: string) => {
    const { error } = await supabase.from(table as never).update({ hidden_at: null, hidden_reason: null } as never).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Restored");
    load();
  };

  const remove = async (table: string, id: string) => {
    if (!confirm("Permanently delete this content?")) return;
    const { error } = await supabase.from(table as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  if (loading) return <Loader />;
  if (rows.length === 0) return <Empty label="Nothing is currently auto-hidden." />;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={`${r.table}:${r.id}`} className="rounded-2xl border border-border bg-card p-3 space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">{r.table.replace("_", " ")} · hidden {formatDistanceToNow(new Date(r.hidden_at), { addSuffix: true })}</p>
          <p className="text-sm line-clamp-3">{r.preview}</p>
          <div className="flex gap-2">
            <button onClick={() => restore(r.table, r.id)} className="flex-1 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
            <button onClick={() => remove(r.table, r.id)} className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ───────────────────────── Bans ───────────────────────── */

const BansTab = () => {
  const [rows, setRows] = useState<BanRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_bans")
      .select("id,user_id,scope,community_id,reason,permanent,expires_at,created_at")
      .or("permanent.eq.true,expires_at.gt." + new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as BanRow[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id,name,branch,year").in("id", ids);
      const map: Record<string, ProfileLite> = {};
      (ps ?? []).forEach((p) => { map[(p as ProfileLite).id] = p as ProfileLite; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const unban = async (id: string) => {
    if (!confirm("Lift this ban?")) return;
    const { error } = await supabase.from("user_bans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ban lifted");
    load();
  };

  if (loading) return <Loader />;
  if (rows.length === 0) return <Empty label="No active bans." />;

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const p = profiles[r.user_id];
        return (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"><Ban className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{p?.name ?? r.user_id.slice(0, 8)}</p>
              <p className="text-[11px] text-muted-foreground">{r.reason} · {r.permanent ? "permanent" : `until ${new Date(r.expires_at!).toLocaleDateString()}`}</p>
            </div>
            <button onClick={() => unban(r.id)} className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold">Lift</button>
          </div>
        );
      })}
    </div>
  );
};

/* ───────────────────────── Roles ───────────────────────── */

const RolesTab = ({ canEdit }: { canEdit: boolean }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [roles, setRoles] = useState<Record<string, string[]>>({});

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,name,branch,year")
      .ilike("name", `%${q}%`)
      .limit(15);
    const list = (data ?? []) as ProfileLite[];
    setResults(list);
    setSearching(false);
    if (list.length) {
      const { data: rs } = await supabase
        .from("user_roles")
        .select("user_id,role")
        .in("user_id", list.map((p) => p.id));
      const map: Record<string, string[]> = {};
      ((rs ?? []) as { user_id: string; role: string }[]).forEach((r) => {
        map[r.user_id] = [...(map[r.user_id] ?? []), r.role];
      });
      setRoles(map);
    }
  };

  const grant = async (userId: string, role: "admin" | "moderator") => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as never);
    if (error && error.code !== "23505") return toast.error(error.message);
    toast.success(`Granted ${role}`);
    search();
  };

  const revoke = async (userId: string, role: "admin" | "moderator") => {
    if (!confirm(`Revoke ${role}?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as never);
    if (error) return toast.error(error.message);
    toast.success(`Revoked ${role}`);
    search();
  };

  return (
    <div className="space-y-3">
      {!canEdit && (
        <p className="text-xs text-muted-foreground p-3 rounded-xl bg-muted">Only admins can grant or revoke roles. You can view assignments below.</p>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); search(); }}
        className="flex gap-2"
      >
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Search</button>
      </form>

      {searching && <Loader />}
      {!searching && results.length === 0 && query && <p className="text-xs text-muted-foreground text-center py-4">No matches.</p>}

      <div className="space-y-2">
        {results.map((p) => {
          const userRoles = roles[p.id] ?? [];
          const isAdmin = userRoles.includes("admin");
          const isMod = userRoles.includes("moderator");
          return (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.branch ?? "—"} · {p.year ?? "—"} year</p>
                <div className="flex gap-1 mt-1">
                  {isAdmin && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">ADMIN</span>}
                  {isMod && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">MODERATOR</span>}
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-1.5">
                  <RoleButton active={isMod} onClick={() => isMod ? revoke(p.id, "moderator") : grant(p.id, "moderator")} label="Mod" />
                  <RoleButton active={isAdmin} onClick={() => isAdmin ? revoke(p.id, "admin") : grant(p.id, "admin")} label="Admin" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RoleButton = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button onClick={onClick} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold", active ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground")}>
    {active ? `Remove ${label}` : `Grant ${label}`}
  </button>
);

/* ───────────────────────── Ban dialog ───────────────────────── */

const DURATIONS: { label: string; days: number | null }[] = [
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "Permanent", days: null },
];

const BanDialog = ({ userId, onClose, onBanned }: { userId: string; onClose: () => void; onBanned: () => void }) => {
  const { user } = useAuth();
  const [duration, setDuration] = useState<number | null>(7);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return toast.error("Reason required");
    setSaving(true);
    const permanent = duration === null;
    const expires_at = permanent ? null : new Date(Date.now() + duration! * 86400_000).toISOString();
    const { error } = await supabase.from("user_bans").insert({
      user_id: userId,
      scope: "global",
      reason: reason.trim(),
      permanent,
      expires_at,
      banned_by: user?.id ?? null,
    } as never);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("User banned");
    onBanned();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Ban className="h-5 w-5 text-destructive" /><h3 className="font-bold">Ban user</h3></div>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Duration</p>
          <div className="flex gap-1.5 flex-wrap">
            {DURATIONS.map((d) => (
              <button key={d.label} onClick={() => setDuration(d.days)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold", duration === d.days ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground")}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Reason (visible in moderation log)</p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 280))} rows={3} className="w-full px-3 py-2 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>
        <button onClick={submit} disabled={saving} className="w-full py-3 rounded-2xl bg-destructive text-destructive-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          {saving ? "Banning…" : "Confirm ban"}
        </button>
      </div>
    </div>
  );
};

/* ───────────────────────── Shared ───────────────────────── */

const Loader = () => (
  <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
);

const Empty = ({ label }: { label: string }) => (
  <div className="py-12 text-center">
    <Eye className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default AdminModeration;