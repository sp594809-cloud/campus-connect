import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert, Users, Flame, Sparkles, GraduationCap, BadgeCheck, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRecruiterRole } from "@/hooks/useRecruiterRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TalentFilters } from "@/components/recruiter/TalentFilters";
import { RecruiterLeaderboard, type SortKey } from "@/components/recruiter/RecruiterLeaderboard";
import { CandidateCard } from "@/components/recruiter/CandidateCard";
import { SkillAnalytics } from "@/components/recruiter/SkillAnalytics";
import { DEFAULT_FILTERS, type ScoreRow, type TalentFilterState } from "@/components/recruiter/types";
import { toast } from "sonner";

const PAGE = 25;

const Metric = ({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; hint?: string }) => (
  <Card><CardContent className="p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
    {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
  </CardContent></Card>
);

const RecruiterDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isRecruiter, loading: roleLoading } = useRecruiterRole();
  const navigate = useNavigate();

  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TalentFilterState>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("employability_score");
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  // Reset on filter/sort change
  useEffect(() => {
    setRows([]); setPage(0); setDone(false);
  }, [filters, sortKey]);

  useEffect(() => {
    if (!isRecruiter) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (supabase as unknown as { from: (t: string)=> any }).from("employability_score_view").select("*");
      // Only show students who have opted in to recruiter visibility.
      q = q.eq("recruiter_visible", true);
      if (filters.branch !== "any") q = q.eq("branch", filters.branch);
      if (filters.graduation_year !== "any") q = q.eq("graduation_year", Number(filters.graduation_year));
      if (filters.placement_status !== "any") q = q.eq("placement_status", filters.placement_status);
      if (filters.verified !== "any") q = q.eq("verified", filters.verified === "yes");
      if (filters.college_name) q = q.ilike("college_name", `%${filters.college_name}%`);
      if (filters.skill) q = q.contains("skills", [filters.skill]);
      if (filters.minStreak > 0) q = q.gte("current_streak", filters.minStreak);
      if (filters.minKarma > 0) q = q.gte("karma_total", filters.minKarma);
      if (filters.search) q = q.or(`name.ilike.%${filters.search}%,username.ilike.%${filters.search}%,branch.ilike.%${filters.search}%`);
      q = q.order(sortKey, { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      const { data, error } = await q;
      if (cancelled) return;
      if (error) { toast.error(error.message); setLoading(false); return; }
      const incoming = (data ?? []) as ScoreRow[];
      setRows(prev => page === 0 ? incoming : [...prev, ...incoming]);
      if (incoming.length < PAGE) setDone(true);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isRecruiter, filters, sortKey, page]);

  // Saved candidates
  useEffect(() => {
    if (!user || !isRecruiter) return;
    supabase.from("recruiter_saved_candidates").select("student_id").eq("recruiter_id", user.id).then(({ data }) => {
      setSavedSet(new Set((data ?? []).map((r: { student_id: string }) => r.student_id)));
    });
  }, [user, isRecruiter]);

  const toggleSave = async (sid: string) => {
    if (!user) return;
    if (savedSet.has(sid)) {
      await supabase.from("recruiter_saved_candidates").delete().eq("recruiter_id", user.id).eq("student_id", sid);
      setSavedSet(prev => { const n = new Set(prev); n.delete(sid); return n; });
    } else {
      const { error } = await supabase.from("recruiter_saved_candidates").insert({ recruiter_id: user.id, student_id: sid });
      if (error) return toast.error(error.message);
      setSavedSet(prev => new Set(prev).add(sid));
      toast.success("Candidate saved");
    }
  };

  const metrics = useMemo(() => {
    const branches = new Map<string, number>();
    for (const r of rows) if (r.branch) branches.set(r.branch, (branches.get(r.branch) ?? 0) + 1);
    const topBranch = Array.from(branches.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? "—";
    return {
      total: rows.length,
      streakers: rows.filter(r => r.current_streak >= 30).length,
      topKarma: rows.slice().sort((a,b)=>b.karma_total - a.karma_total).slice(0,5).reduce((s,r)=>s+r.karma_total, 0),
      branch: topBranch,
      verified: rows.filter(r => r.verified).length,
      placed: rows.filter(r => r.placement_status === "Placed").length,
    };
  }, [rows]);

  if (authLoading || roleLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!isRecruiter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 mx-auto text-warning" />
          <h2 className="text-lg font-bold">Recruiter access required</h2>
          <p className="text-sm text-muted-foreground">Your account doesn’t have the recruiter role yet. Contact an admin to request access.</p>
          <Button asChild variant="secondary"><Link to="/campus">Back to Campus</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold">Recruiter Dashboard</h1>
            <p className="text-sm text-muted-foreground">Discover students by Proof-of-Work signals.</p>
          </div>
          <Button asChild variant="ghost"><Link to="/campus">Exit</Link></Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <Metric icon={Users} label="Active" value={metrics.total} />
          <Metric icon={Flame} label="30+ Streak" value={metrics.streakers} />
          <Metric icon={Sparkles} label="Top Karma (Σ5)" value={metrics.topKarma} />
          <Metric icon={GraduationCap} label="Top Branch" value={metrics.branch} />
          <Metric icon={BadgeCheck} label="Verified" value={metrics.verified} />
          <Metric icon={Briefcase} label="Placed" value={metrics.placed} />
        </div>

        <div className="grid lg:grid-cols-[320px,1fr] gap-5">
          <div className="space-y-4">
            <TalentFilters value={filters} onChange={setFilters} />
            <SkillAnalytics rows={rows} />
          </div>
          <div>
            <Tabs defaultValue="leaderboard">
              <TabsList>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="cards">Cards</TabsTrigger>
              </TabsList>
              <TabsContent value="leaderboard" className="mt-3">
                {loading && rows.length === 0 ? (
                  <div className="space-y-2">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
                ) : (
                  <RecruiterLeaderboard rows={rows} sortKey={sortKey} onSort={setSortKey} />
                )}
                {!done && rows.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <Button variant="secondary" onClick={()=>setPage(p=>p+1)} disabled={loading}>{loading ? "Loading…" : "Load more"}</Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="cards" className="mt-3">
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {rows.map(r => <CandidateCard key={r.id} row={r} saved={savedSet.has(r.id)} onSave={()=>toggleSave(r.id)} />)}
                </div>
                {!done && rows.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <Button variant="secondary" onClick={()=>setPage(p=>p+1)} disabled={loading}>{loading ? "Loading…" : "Load more"}</Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;