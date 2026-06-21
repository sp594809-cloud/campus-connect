import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, GraduationCap, MessageCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avatarFor, type PublicProfile } from "@/hooks/useProfiles";
import { InterestChip } from "@/components/campus/InterestChip";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [p, setP] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,name,branch,year,bio,avatar_url,interests,skills,open_to_mentor,looking_for_mentor_in,placement_status,company,college_email_verified")
        .eq("id", id).maybeSingle();
      setP(data as PublicProfile | null);
      setLoading(false);
      if (data && user && user.id !== id) {
        supabase.rpc("log_profile_view", { _viewed: id, _source: "profile" }).then(() => {}, (e) => console.error("[log_profile_view]", e));
      }
    })();
  }, [id, user?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!p) return (
    <div className="min-h-screen flex items-center justify-center text-sm text-center px-6">
      <div>
        <p className="font-semibold">Profile not available</p>
        <p className="text-muted-foreground text-xs mt-1">This user's profile is private.</p>
      </div>
    </div>
  );

  const isMe = user?.id === p.id;

  const startChat = async () => {
    if (!user) return;
    await supabase.rpc("get_or_create_conversation", { other_user: p.id });
    navigate("/campus");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
      <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-elevated">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-bold text-base ml-2">Profile</h1>
        </div>
        <div className="p-5">
          <div className="rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
            <div className="flex items-start gap-4 relative">
              <img src={avatarFor(p)} alt={p.name} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-primary-foreground/20 shadow-soft" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-bold leading-tight">{p.name}</h2>
                  {p.college_email_verified && <ShieldCheck className="h-4 w-4" />}
                </div>
                <p className="text-xs opacity-90 mt-0.5 flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {p.branch ?? "—"} · {p.year ?? "—"} year</p>
                {p.placement_status === "Placed" && p.company && <p className="text-xs opacity-95 mt-1 flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> Placed @ {p.company}</p>}
                {p.bio && <p className="text-xs opacity-90 mt-2">{p.bio}</p>}
              </div>
            </div>
          </div>

          {!isMe && (
            <div className="mt-4 flex gap-2">
              <button onClick={startChat} className="flex-1 bg-gradient-hero text-primary-foreground py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow"><MessageCircle className="h-4 w-4" /> Message</button>
            </div>
          )}

          {!!p.interests?.length && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Interests</p>
              <div className="flex gap-1.5 flex-wrap">{p.interests.map((i) => <InterestChip key={i} label={i} />)}</div>
            </div>
          )}
          {!!p.skills?.length && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Skills</p>
              <div className="flex gap-1.5 flex-wrap">{p.skills.map((s) => <span key={s} className="px-3 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-semibold">{s}</span>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;