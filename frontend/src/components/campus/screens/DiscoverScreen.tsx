import { useMemo, useState } from "react";
import { Briefcase, Check, Clock, GraduationCap, MessageCircle, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Header } from "../Header";
import { ALL_INTERESTS } from "@/data/constants";
import { InterestChip } from "../InterestChip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProfiles, avatarFor, type PublicProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useConnections } from "@/hooks/useConnections";
import { useNavigate } from "react-router-dom";

const branches = ["CSE","ECE","ME","EE","CE","IT","Other"];
const years = ["1st","2nd","3rd","4th"];

export const DiscoverScreen = ({ onMessage }: { onMessage: (id: string) => void }) => {
  const { user, profile } = useAuth();
  const { profiles, loading } = useProfiles(user?.id);
  const { stateWith, reload } = useConnections();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [branch, setBranch] = useState<string>("All");
  const [year, setYear] = useState<string>("All");
  const [mentorOnly, setMentorOnly] = useState(false);
  const [placedOnly, setPlacedOnly] = useState(false);
  const [activeInterests, setActiveInterests] = useState<string[]>([]);
  const [requestTo, setRequestTo] = useState<PublicProfile | null>(null);
  const [reqMessage, setReqMessage] = useState("");
  const [sending, setSending] = useState(false);

  const filtered = useMemo(() => {
    return profiles.filter((s) => {
      if (branch !== "All" && s.branch !== branch) return false;
      if (year !== "All" && s.year !== year) return false;
      if (mentorOnly && !s.open_to_mentor) return false;
      if (placedOnly && s.placement_status !== "Placed") return false;
      if (activeInterests.length && !activeInterests.some((i) => s.interests.includes(i))) return false;
      return true;
    });
  }, [profiles, branch, year, mentorOnly, placedOnly, activeInterests]);

  const myInterests = profile?.interests ?? [];
  const peopleYouMayKnow = useMemo(() => {
    if (!myInterests.length) return [];
    return profiles
      .map((p) => ({ p, shared: p.interests.filter((i) => myInterests.includes(i)).length }))
      .filter((x) => x.shared >= 3)
      .sort((a, b) => b.shared - a.shared)
      .slice(0, 10);
  }, [profiles, myInterests]);

  const myBranchPeers = useMemo(() => {
    if (!profile?.branch) return [];
    return profiles.filter((p) => p.branch === profile.branch).slice(0, 10);
  }, [profiles, profile?.branch]);

  const toggle = (i: string) => setActiveInterests((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i]);

  const startChat = async (otherId: string) => {
    if (!user) return;
    const s = stateWith(otherId).state;
    if (s !== "accepted") {
      toast.error("You need to be connected first to chat.");
      return;
    }
    onMessage(otherId);
    await supabase.rpc("get_or_create_conversation", { other_user: otherId });
  };

  const sendRequest = async () => {
    if (!user || !requestTo) return;
    setSending(true);
    const message = reqMessage.trim().slice(0, 280);
    let { error } = await supabase.from("connection_requests").insert({
      requester_id: user.id,
      recipient_id: requestTo.id,
      message,
    });
    if (error && (error.code === "23505" || /duplicate/i.test(error.message))) {
      await supabase.from("connection_requests").delete()
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${requestTo.id}),and(requester_id.eq.${requestTo.id},recipient_id.eq.${user.id})`);
      const retry = await supabase.from("connection_requests").insert({ requester_id: user.id, recipient_id: requestTo.id, message });
      error = retry.error;
    }
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`Request sent to ${requestTo.name.split(" ")[0]}!`);
    setRequestTo(null);
    setReqMessage("");
    reload();
  };

  return (
    <div className="animate-fade-in-up">
      <Header title="Discover" subtitle={`${filtered.length} students match`} />

      {!loading && peopleYouMayKnow.length > 0 && (
        <section className="px-5 mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">People you may know</p>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {peopleYouMayKnow.map(({ p, shared }) => (
              <button key={p.id} onClick={() => startChat(p.id)} className="min-w-[140px] rounded-2xl bg-card border border-border/60 shadow-soft p-3 text-left hover:shadow-elevated transition-smooth">
                <img src={avatarFor(p)} alt={p.name} loading="lazy" className="h-14 w-14 rounded-2xl object-cover" />
                <p className="font-bold text-sm mt-2 truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{p.branch} · {p.year}</p>
                <p className="text-[10px] font-semibold text-accent mt-1">{shared} shared interests</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {!loading && myBranchPeers.length > 0 && (
        <section className="px-5 mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">My branch · {profile?.branch}</p>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {myBranchPeers.map((p) => (
              <button key={p.id} onClick={() => startChat(p.id)} className="min-w-[120px] rounded-2xl bg-gradient-card border border-border/60 shadow-soft p-3 text-left hover:shadow-elevated transition-smooth">
                <img src={avatarFor(p)} alt={p.name} loading="lazy" className="h-12 w-12 rounded-full object-cover" />
                <p className="font-bold text-sm mt-2 truncate">{p.name.split(" ")[0]}</p>
                <p className="text-[11px] text-muted-foreground truncate">{p.year} year</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="px-5 mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-smooth",
            showFilters || branch !== "All" || year !== "All" || mentorOnly || placedOnly || activeInterests.length
              ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
          <QuickToggle active={mentorOnly} onClick={() => setMentorOnly((v) => !v)}>🧑‍🏫 Mentors</QuickToggle>
          <QuickToggle active={placedOnly} onClick={() => setPlacedOnly((v) => !v)}>💼 Placed</QuickToggle>
        </div>
      </div>

      {showFilters && (
        <div className="px-5 mt-3 p-4 rounded-2xl bg-card border border-border shadow-soft animate-scale-in space-y-4 mx-5">
          <FilterGroup label="Branch" options={["All", ...branches]} value={branch} onChange={setBranch} />
          <FilterGroup label="Year" options={["All", ...years]} value={year} onChange={setYear} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Interests</p>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_INTERESTS.map((i) => (
                <InterestChip key={i} label={i} active={activeInterests.includes(i)} onClick={() => toggle(i)} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 mt-4 grid grid-cols-1 gap-3">
        {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">No matches yet</p>
            <p className="text-sm text-muted-foreground">Try loosening your filters — invite friends to join too!</p>
          </div>
        )}
        {filtered.map((s, i) => (
          <ProfileCard
            key={s.id}
            s={s}
            delay={i * 30}
            connState={stateWith(s.id).state}
            onConnect={() => setRequestTo(s)}
            onMessage={() => startChat(s.id)}
            onOpenProfile={() => navigate(`/u/${s.id}`)}
          />
        ))}
      </div>

      {requestTo && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in-up" onClick={() => setRequestTo(null)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Send connection request</h3>
              <button onClick={() => setRequestTo(null)} aria-label="Close" className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <img src={avatarFor(requestTo)} alt="" className="h-12 w-12 rounded-2xl object-cover" />
              <div>
                <p className="font-bold text-sm">{requestTo.name}</p>
                <p className="text-xs text-muted-foreground">{requestTo.branch} · {requestTo.year} year</p>
              </div>
            </div>
            <textarea value={reqMessage} onChange={(e) => setReqMessage(e.target.value.slice(0, 280))} rows={4} placeholder="Why do you want to connect? (e.g. I'd love advice on internships, or let's collab on a project)" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <div className="flex justify-between items-center mt-1 text-[11px] text-muted-foreground"><span>Optional but recommended</span><span>{reqMessage.length}/280</span></div>
            <button onClick={sendRequest} disabled={sending} className="w-full mt-3 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> {sending ? "Sending…" : "Send request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileCard = ({ s, delay, connState, onConnect, onMessage, onOpenProfile }: { s: PublicProfile; delay: number; connState: string; onConnect: () => void; onMessage: () => void; onOpenProfile: () => void }) => (
  <article className="rounded-3xl bg-card shadow-soft border border-border/60 overflow-hidden animate-fade-in-up hover:shadow-elevated transition-smooth" style={{ animationDelay: `${delay}ms` }}>
    <div className="p-4 flex gap-4">
      <button onClick={onOpenProfile} className="relative shrink-0">
        <img src={avatarFor(s)} alt={s.name} loading="lazy" className="h-20 w-20 rounded-2xl object-cover shadow-soft" />
        {s.open_to_mentor && (
          <span className="absolute -bottom-1.5 -right-1.5 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-soft">MENTOR</span>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <button onClick={onOpenProfile} className="flex items-center gap-1.5 text-left">
          <h3 className="font-bold text-base truncate hover:underline">{s.name}</h3>
          {s.college_email_verified && <ShieldCheck className="h-3.5 w-3.5 text-success" />}
        </button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          <GraduationCap className="h-3.5 w-3.5" /> {s.branch ?? "—"} · {s.year ?? "—"} year
        </div>
        {s.placement_status === "Placed" && s.company && (
          <div className="flex items-center gap-1.5 text-xs text-success font-semibold mt-1">
            <Briefcase className="h-3.5 w-3.5" /> Placed @ {s.company}
          </div>
        )}
        {s.bio && <p className="text-xs text-foreground/80 mt-2 line-clamp-2">{s.bio}</p>}
      </div>
    </div>
    <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
      {s.interests.slice(0, 4).map((i) => <InterestChip key={i} label={i} />)}
    </div>
    <div className="px-4 pb-4 flex gap-2">
      {connState === "accepted" ? (
        <button onClick={onMessage} className="flex-1 bg-gradient-hero text-primary-foreground font-semibold text-sm py-2.5 rounded-xl shadow-soft hover:shadow-glow transition-smooth flex items-center justify-center gap-1.5">
          <MessageCircle className="h-4 w-4" /> Message
        </button>
      ) : connState === "pending_out" ? (
        <button disabled className="flex-1 bg-secondary text-secondary-foreground font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5 opacity-80">
          <Clock className="h-4 w-4" /> Request sent
        </button>
      ) : connState === "pending_in" ? (
        <button disabled className="flex-1 bg-accent-soft text-accent font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5">
          <Check className="h-4 w-4" /> Respond from 🔔
        </button>
      ) : (
        <button onClick={onConnect} className="flex-1 bg-gradient-hero text-primary-foreground font-semibold text-sm py-2.5 rounded-xl shadow-soft hover:shadow-glow transition-smooth flex items-center justify-center gap-1.5">
          <Sparkles className="h-4 w-4" /> Connect
        </button>
      )}
    </div>
  </article>
);

const FilterGroup = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth",
          value === o ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>{o}</button>
      ))}
    </div>
  </div>
);

const QuickToggle = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={cn("px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-smooth flex items-center gap-1",
    active ? "bg-accent text-accent-foreground shadow-soft" : "bg-secondary text-secondary-foreground")}>
    {children}{active && <X className="h-3 w-3" />}
  </button>
);