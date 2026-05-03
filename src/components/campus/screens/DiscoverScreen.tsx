import { useMemo, useState } from "react";
import { Briefcase, GraduationCap, MessageCircle, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Header } from "../Header";
import { ALL_INTERESTS } from "@/data/constants";
import { InterestChip } from "../InterestChip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProfiles, avatarFor, type PublicProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const branches = ["CSE","ECE","ME","EE","CE","IT","Other"];
const years = ["1st","2nd","3rd","4th"];

export const DiscoverScreen = ({ onMessage }: { onMessage: (id: string) => void }) => {
  const { user } = useAuth();
  const { profiles, loading } = useProfiles(user?.id);
  const [showFilters, setShowFilters] = useState(false);
  const [branch, setBranch] = useState<string>("All");
  const [year, setYear] = useState<string>("All");
  const [mentorOnly, setMentorOnly] = useState(false);
  const [placedOnly, setPlacedOnly] = useState(false);
  const [activeInterests, setActiveInterests] = useState<string[]>([]);

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

  const toggle = (i: string) => setActiveInterests((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i]);

  const startChat = async (otherId: string) => {
    if (!user) return;
    onMessage(otherId);
    await supabase.rpc("get_or_create_conversation", { other_user: otherId });
  };

  return (
    <div className="animate-fade-in-up">
      <Header title="Discover" subtitle={`${filtered.length} students match`} />

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
        {filtered.map((s, i) => <ProfileCard key={s.id} s={s} delay={i * 30} onMessage={() => startChat(s.id)} />)}
      </div>
    </div>
  );
};

const ProfileCard = ({ s, delay, onMessage }: { s: PublicProfile; delay: number; onMessage: () => void }) => (
  <article className="rounded-3xl bg-card shadow-soft border border-border/60 overflow-hidden animate-fade-in-up hover:shadow-elevated transition-smooth" style={{ animationDelay: `${delay}ms` }}>
    <div className="p-4 flex gap-4">
      <div className="relative">
        <img src={avatarFor(s)} alt={s.name} loading="lazy" className="h-20 w-20 rounded-2xl object-cover shadow-soft" />
        {s.open_to_mentor && (
          <span className="absolute -bottom-1.5 -right-1.5 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-soft">MENTOR</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-base truncate">{s.name}</h3>
          {s.college_email_verified && <ShieldCheck className="h-3.5 w-3.5 text-success" />}
        </div>
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
      <button
        onClick={() => toast.success(`Connection request sent to ${s.name.split(" ")[0]}!`)}
        className="flex-1 bg-gradient-hero text-primary-foreground font-semibold text-sm py-2.5 rounded-xl shadow-soft hover:shadow-glow transition-smooth flex items-center justify-center gap-1.5"
      >
        <Sparkles className="h-4 w-4" /> Connect
      </button>
      <button onClick={onMessage} aria-label="Message" className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-muted transition-smooth">
        <MessageCircle className="h-4 w-4" />
      </button>
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