import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Mail, Send, ShieldCheck, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRecruiterRole } from "@/hooks/useRecruiterRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PassportHeader, type PassportProfile } from "@/components/passport/PassportHeader";
import { EmployabilityScoreCard } from "@/components/passport/EmployabilityScoreCard";
import { KarmaHeatmap } from "@/components/passport/KarmaHeatmap";
import { StreakCalendar } from "@/components/passport/StreakCalendar";
import { PlacementTimeline } from "@/components/passport/PlacementTimeline";
import { EmployabilityRadar } from "@/components/recruiter/EmployabilityRadar";
import { computeScore, fetchPassportData } from "@/lib/employability";

const RecruiterStudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isRecruiter, loading: roleLoading } = useRecruiterRole();

  const [profile, setProfile] = useState<PassportProfile | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPassportData>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<{ id: string; note: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase.from("profiles")
        .select("id,name,username,avatar_url,branch,year,college_name,graduation_year,placement_status,company,karma_total,verified,resume_url,bio,skills")
        .eq("id", id).maybeSingle();
      if (p) {
        setProfile(p as unknown as PassportProfile);
        setData(await fetchPassportData(p.id));
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("recruiter_saved_candidates").select("shortlisted").eq("recruiter_id", user.id).eq("student_id", id).maybeSingle()
      .then(({ data }) => { setSaved(!!data); setShortlisted(!!data?.shortlisted); });
    supabase.from("recruiter_notes").select("id,note,created_at").eq("recruiter_id", user.id).eq("student_id", id).order("created_at", { ascending: false })
      .then(({ data }) => setNotes(data ?? []));
  }, [user, id]);

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

  const timelineItems = useMemo(() => {
    if (!data) return [];
    return data.interviews.map((i: { id: string; created_at: string; company_name: string; role: string; outcome: string }) => ({
      id: `i-${i.id}`, date: i.created_at, kind: "interview" as const,
      title: `${i.company_name} — ${i.role}`, subtitle: `Outcome: ${i.outcome}`, tag: "Interview",
    }));
  }, [data]);

  const toggleSave = async () => {
    if (!user || !id) return;
    if (saved) {
      await supabase.from("recruiter_saved_candidates").delete().eq("recruiter_id", user.id).eq("student_id", id);
      setSaved(false); setShortlisted(false);
    } else {
      await supabase.from("recruiter_saved_candidates").insert({ recruiter_id: user.id, student_id: id });
      setSaved(true);
      toast.success("Saved");
    }
  };

  const toggleShortlist = async () => {
    if (!user || !id) return;
    if (!saved) await toggleSave();
    const { error } = await supabase.from("recruiter_saved_candidates")
      .upsert({ recruiter_id: user.id, student_id: id, shortlisted: !shortlisted }, { onConflict: "recruiter_id,student_id" });
    if (error) return toast.error(error.message);
    setShortlisted(!shortlisted);
  };

  const addNote = async () => {
    if (!user || !id || !note.trim()) return;
    const { data: row, error } = await supabase.from("recruiter_notes").insert({ recruiter_id: user.id, student_id: id, note: note.trim() }).select("id,note,created_at").single();
    if (error) return toast.error(error.message);
    setNotes(prev => [row, ...prev]);
    setNote("");
  };

  const contact = async () => {
    if (!profile) return;
    await supabase.rpc("get_or_create_conversation", { other_user: profile.id });
    navigate("/campus");
  };

  if (authLoading || roleLoading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-32 w-64" /></div>;
  if (!isRecruiter) return <div className="min-h-screen flex items-center justify-center text-sm">Recruiter access required.</div>;
  if (loading) return <div className="min-h-screen p-6"><Skeleton className="h-44 w-full max-w-5xl mx-auto rounded-3xl" /></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-sm">Student not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>
        <PassportHeader p={profile} isOwner={false} isAdmin={false} onMessage={contact} onConnect={contact} />

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1 space-y-4">
            {score && <EmployabilityScoreCard score={score} />}
            {score && <EmployabilityRadar score={score} />}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Recruiter Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={toggleSave} variant={saved ? "default" : "secondary"} className="w-full"><Bookmark className="h-4 w-4 mr-1" /> {saved ? "Saved" : "Save Candidate"}</Button>
                <Button onClick={contact} variant="secondary" className="w-full"><Mail className="h-4 w-4 mr-1" /> Contact Student</Button>
                <Button onClick={toggleShortlist} variant={shortlisted ? "default" : "secondary"} className="w-full"><ShieldCheck className="h-4 w-4 mr-1" /> {shortlisted ? "Shortlisted" : "Shortlist"}</Button>
                <Button onClick={() => toast.success("Assessment invite queued (demo)")} variant="secondary" className="w-full"><Send className="h-4 w-4 mr-1" /> Invite to Assessment</Button>
                <Button asChild variant="ghost" className="w-full"><Link to={`/passport/${profile.username || profile.id}`}>View Public Passport</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Private Notes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Note for your team…" rows={3} />
                <Button onClick={addNote} disabled={!note.trim()} className="w-full">Add note</Button>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notes.map(n => (
                    <div key={n.id} className="rounded-lg bg-secondary p-2 text-xs">
                      <p>{n.note}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-4">
            <KarmaHeatmap events={data?.karma ?? []} />
            <StreakCalendar completions={data?.completions ?? []} streak={(data?.streak ?? null) as Parameters<typeof StreakCalendar>[0]["streak"]} />
            <PlacementTimeline items={timelineItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterStudentDetail;