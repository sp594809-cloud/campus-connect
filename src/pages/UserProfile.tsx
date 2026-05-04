import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Check, Clock, GraduationCap, MessageCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avatarFor, type PublicProfile } from "@/hooks/useProfiles";
import { useConnections } from "@/hooks/useConnections";
import { InterestChip } from "@/components/campus/InterestChip";
import { toast } from "sonner";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stateWith, reload } = useConnections();
  const [p, setP] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReq, setShowReq] = useState(false);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,name,branch,year,bio,avatar_url,interests,skills,open_to_mentor,looking_for_mentor_in,placement_status,company,college_email_verified")
        .eq("id", id).maybeSingle();
      setP(data as PublicProfile | null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!p) return <div className="min-h-screen flex items-center justify-center text-sm">User not found</div>;

  const isMe = user?.id === p.id;
  const cs = stateWith(p.id).state;

  const send = async () => {
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from("connection_requests").insert({ requester_id: user.id, recipient_id: p.id, message: msg.trim().slice(0, 280) });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Request sent!");
    setShowReq(false); setMsg(""); reload();
  };

  const startChat = async () => {
    if (cs !== "accepted") { toast.error("Connect first to chat."); return; }
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
              {cs === "accepted" ? (
                <button onClick={startChat} className="flex-1 bg-gradient-hero text-primary-foreground py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow"><MessageCircle className="h-4 w-4" /> Message</button>
              ) : cs === "pending_out" ? (
                <button disabled className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"><Clock className="h-4 w-4" /> Request sent</button>
              ) : cs === "pending_in" ? (
                <button disabled className="flex-1 bg-accent-soft text-accent py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"><Check className="h-4 w-4" /> Open 🔔 to respond</button>
              ) : (
                <button onClick={() => setShowReq(true)} className="flex-1 bg-gradient-hero text-primary-foreground py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow"><Sparkles className="h-4 w-4" /> Connect</button>
              )}
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

      {showReq && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowReq(false)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Send connection request</h3>
              <button onClick={() => setShowReq(false)} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 280))} rows={4} placeholder="Why do you want to connect?" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none resize-none" />
            <button onClick={send} disabled={sending} className="w-full mt-3 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50">{sending ? "Sending…" : "Send request"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;