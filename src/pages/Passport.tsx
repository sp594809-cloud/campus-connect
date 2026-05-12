import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PassportHeader, type PassportProfile } from "@/components/passport/PassportHeader";
import { EmployabilityScoreCard } from "@/components/passport/EmployabilityScoreCard";
import { KarmaHeatmap } from "@/components/passport/KarmaHeatmap";
import { StreakCalendar } from "@/components/passport/StreakCalendar";
import { PlacementTimeline } from "@/components/passport/PlacementTimeline";
import { RecruiterInsightCard } from "@/components/passport/RecruiterInsightCard";
import { computeScore, fetchPassportData } from "@/lib/employability";

const Passport = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PassportProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPassportData>> | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      // Try username first, then id
      const looksUuid = /^[0-9a-f-]{36}$/i.test(slug);
      const q = supabase.from("profiles").select("id,name,username,avatar_url,branch,year,college_name,graduation_year,placement_status,company,karma_total,verified,resume_url,bio,skills");
      const { data: prof } = looksUuid ? await q.eq("id", slug).maybeSingle() : await q.eq("username", slug).maybeSingle();
      if (!prof) { setLoading(false); return; }
      setProfile(prof as unknown as PassportProfile);
      const d = await fetchPassportData(prof.id);
      setData(d);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user?.id]);

  const score = useMemo(() => {
    if (!profile || !data) return null;
    return computeScore({
      karma_total: profile.karma_total ?? 0,
      current_streak: (data.streak as { current_streak?: number } | null)?.current_streak ?? 0,
      longest_streak: (data.streak as { longest_streak?: number } | null)?.longest_streak ?? 0,
      total_completed: (data.streak as { total_completed?: number } | null)?.total_completed ?? 0,
      interview_posts: data.interviews.length,
      posts_count: data.posts.length,
      mentorships: 0,
    });
  }, [profile, data]);

  const insights = useMemo(() => {
    if (!profile || !data) return [] as string[];
    const out: string[] = [];
    const cur = (data.streak as { current_streak?: number } | null)?.current_streak ?? 0;
    const longest = (data.streak as { longest_streak?: number } | null)?.longest_streak ?? 0;
    const total = (data.streak as { total_completed?: number } | null)?.total_completed ?? 0;
    if (cur >= 7) out.push(`Maintained ${cur}-day coding streak`);
    if (longest >= 30) out.push(`Hit a ${longest}-day longest streak — top consistency tier`);
    if (total >= 50) out.push(`${total} DSA problems completed`);
    if (data.interviews.length) out.push(`Shared ${data.interviews.length} interview experience${data.interviews.length>1?"s":""}`);
    if (profile.karma_total >= 200) out.push(`Top community contributor — ${profile.karma_total} karma earned`);
    if (data.posts.length >= 10) out.push(`Active poster — ${data.posts.length} contributions`);
    return out;
  }, [profile, data]);

  const tags = useMemo(() => {
    const skills = ((profile as unknown as { skills?: string[] })?.skills) ?? [];
    const fromPosts = (data?.posts ?? [])
      .map((p: { tag: string | null }) => p.tag)
      .filter((t): t is string => !!t);
    return Array.from(new Set([...skills, ...fromPosts])).slice(0, 16);
  }, [profile, data]);

  const timelineItems = useMemo(() => {
    if (!data) return [];
    const fromInterviews = data.interviews.map((i: { id: string; created_at: string; company_name: string; role: string; outcome: string }) => ({
      id: `i-${i.id}`, date: i.created_at, kind: "interview" as const,
      title: `${i.company_name} — ${i.role}`, subtitle: `Outcome: ${i.outcome}`, tag: "Interview",
    }));
    const placementTags = new Set(["placed", "placement", "offer", "referral", "achievement"]);
    const fromPosts = data.posts
      .filter((p: { tag: string | null; type: string }) => (p.tag && placementTags.has(p.tag.toLowerCase())) || p.type === "placement_update" || p.type === "achievement")
      .map((p: { id: string; created_at: string; content: string; tag: string | null }) => ({
        id: `p-${p.id}`, date: p.created_at, kind: "post" as const,
        title: p.content.slice(0, 60), subtitle: p.content.slice(60, 200), tag: p.tag ?? undefined,
      }));
    return [...fromInterviews, ...fromPosts].sort((a,b)=> b.date.localeCompare(a.date)).slice(0, 12);
  }, [data]);

  const verify = async () => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ verified: true }).eq("id", profile.id);
    if (error) return toast.error(error.message);
    setProfile({ ...profile, verified: true });
    toast.success("Student verified");
  };

  const startChat = async () => {
    if (!profile || !user) return;
    await supabase.rpc("get_or_create_conversation", { other_user: profile.id });
    navigate("/campus");
  };

  if (loading) return <PassportSkeleton />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-sm">Passport not found.</div>;

  const isOwner = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-smooth mb-3">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <PassportHeader p={profile} isOwner={isOwner} isAdmin={isAdmin} onMessage={startChat} onVerify={verify} onConnect={() => navigate(`/u/${profile.id}`)} />
        <div className="grid gap-4 mt-4 md:grid-cols-3">
          <div className="md:col-span-1 space-y-4">
            {score && <EmployabilityScoreCard score={score} />}
            <RecruiterInsightCard insights={insights} />
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Recruiter Tags</CardTitle></CardHeader>
              <CardContent>
                {tags.length === 0 ? <p className="text-xs text-muted-foreground">No tags yet.</p> :
                  <div className="flex flex-wrap gap-1.5">{tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>}
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-4">
            <KarmaHeatmap events={data?.karma ?? []} />
            <StreakCalendar completions={data?.completions ?? []} streak={(data?.streak ?? null) as Parameters<typeof StreakCalendar>[0]["streak"]} />
            <PlacementTimeline items={timelineItems} />
          </div>
        </div>
        {profile.verified && (
          <p className="text-[11px] text-muted-foreground mt-6 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Profile verified by college admin
          </p>
        )}
      </div>
    </div>
  );
};

const PassportSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft p-6">
    <div className="mx-auto max-w-5xl space-y-4">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl md:col-span-2" />
      </div>
    </div>
  </div>
);

export default Passport;