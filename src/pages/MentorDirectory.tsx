import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avatarFor, type PublicProfile } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";

interface Mentor extends PublicProfile {
  mentor_bio?: string | null;
  mentor_topics?: string[];
  weekly_capacity?: number;
}

const MentorDirectory = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [topic, setTopic] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles")
        .select("id,name,branch,year,bio,avatar_url,interests,skills,open_to_mentor,looking_for_mentor_in,placement_status,company,college_email_verified,mentor_bio,mentor_topics,weekly_capacity")
        .eq("mentor_mode", true);
      setMentors((data ?? []) as unknown as Mentor[]);
    })();
  }, []);

  const allTopics = Array.from(new Set(mentors.flatMap((m) => m.mentor_topics ?? [])));
  const filtered = topic === "all" ? mentors : mentors.filter((m) => m.mentor_topics?.includes(topic));

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
      <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-elevated pb-10">
        <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
          <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
          <h1 className="font-bold text-base ml-1">Mentor Directory</h1>
        </div>

        <div className="p-5">
          <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5 shadow-elevated relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90"><Sparkles className="h-3.5 w-3.5" /> {mentors.length} mentors</div>
            <p className="mt-2 text-lg font-bold leading-snug">Seniors who've cracked it. Ask anything.</p>
          </div>

          {allTopics.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
              <Chip active={topic === "all"} onClick={() => setTopic("all")}>All topics</Chip>
              {allTopics.map((t) => <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>{t}</Chip>)}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🧑‍🏫</p>
                <p className="font-semibold">No mentors yet</p>
                <p className="text-sm text-muted-foreground">Toggle "Mentor mode" on your profile to be the first.</p>
              </div>
            )}
            {filtered.map((m) => (
              <div key={m.id} className="rounded-2xl bg-card border border-border/60 shadow-soft p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => nav(`/u/${m.id}`)}>
                    <img src={avatarFor(m)} alt={m.name} className="h-14 w-14 rounded-2xl object-cover" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => nav(`/u/${m.id}`)} className="font-bold text-sm truncate text-left hover:underline">{m.name}</button>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="h-3 w-3" />{m.branch ?? "—"} · {m.year ?? "—"} year</p>
                    {m.placement_status === "Placed" && m.company && <p className="text-xs text-success font-semibold mt-0.5">@ {m.company}</p>}
                  </div>
                  <button disabled={!user || user.id === m.id} onClick={() => nav(`/campus`)} className="px-3 py-2 rounded-full bg-gradient-hero text-primary-foreground text-xs font-semibold shadow-soft disabled:opacity-50 flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </button>
                </div>
                {m.mentor_bio && <p className="text-xs text-foreground/80 mt-3 line-clamp-3">{m.mentor_bio}</p>}
                {m.mentor_topics && m.mentor_topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.mentor_topics.slice(0, 6).map((t) => <span key={t} className="text-[10px] font-semibold bg-accent-soft text-accent px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">Capacity: {m.weekly_capacity ?? 3}/week</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={cn("px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap", active ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground")}>{children}</button>
);

export default MentorDirectory;