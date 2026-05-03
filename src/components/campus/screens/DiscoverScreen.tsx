import { useMemo, useState } from "react";
import { Briefcase, GraduationCap, MessageCircle, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Header } from "../Header";
import { ALL_INTERESTS, students, type Branch, type Year } from "@/data/mockData";
import { InterestChip } from "../InterestChip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const branches: Branch[] = ["CSE", "ECE", "ME", "EE", "CE", "IT"];
const years: Year[] = ["1st", "2nd", "3rd", "4th"];

export const DiscoverScreen = ({ onMessage }: { onMessage: (id: string) => void }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [branch, setBranch] = useState<Branch | "All">("All");
  const [year, setYear] = useState<Year | "All">("All");
  const [mentorOnly, setMentorOnly] = useState(false);
  const [placedOnly, setPlacedOnly] = useState(false);
  const [activeInterests, setActiveInterests] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (branch !== "All" && s.branch !== branch) return false;
      if (year !== "All" && s.year !== year) return false;
      if (mentorOnly && !s.openToMentor) return false;
      if (placedOnly && s.placementStatus !== "Placed") return false;
      if (activeInterests.length && !activeInterests.some((i) => s.interests.includes(i))) return false;
      return true;
    });
  }, [branch, year, mentorOnly, placedOnly, activeInterests]);

  const toggle = (i: string) =>
    setActiveInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  return (
    <div className="animate-fade-in-up">
      <Header title="Discover" subtitle={`${filtered.length} students match`} />

      <div className="px-5 mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-smooth",
            showFilters || branch !== "All" || year !== "All" || mentorOnly || placedOnly || activeInterests.length
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
          <QuickToggle active={mentorOnly} onClick={() => setMentorOnly((v) => !v)}>
            🧑‍🏫 Mentors
          </QuickToggle>
          <QuickToggle active={placedOnly} onClick={() => setPlacedOnly((v) => !v)}>
            💼 Placed
          </QuickToggle>
        </div>
      </div>

      {showFilters && (
        <div className="px-5 mt-3 p-4 rounded-2xl bg-card border border-border shadow-soft animate-scale-in space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Branch</p>
            <div className="flex gap-1.5 flex-wrap">
              <Pill active={branch === "All"} onClick={() => setBranch("All")}>All</Pill>
              {branches.map((b) => (
                <Pill key={b} active={branch === b} onClick={() => setBranch(b)}>{b}</Pill>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Year</p>
            <div className="flex gap-1.5 flex-wrap">
              <Pill active={year === "All"} onClick={() => setYear("All")}>All</Pill>
              {years.map((y) => (
                <Pill key={y} active={year === y} onClick={() => setYear(y)}>{y}</Pill>
              ))}
            </div>
          </div>
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
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">No matches yet</p>
            <p className="text-sm text-muted-foreground">Try loosening your filters.</p>
          </div>
        )}

        {filtered.map((s, i) => (
          <article
            key={s.id}
            className="rounded-3xl bg-card shadow-soft border border-border/60 overflow-hidden animate-fade-in-up hover:shadow-elevated transition-smooth"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="p-4 flex gap-4">
              <div className="relative">
                <img
                  src={s.avatar}
                  alt={s.name}
                  loading="lazy"
                  className="h-20 w-20 rounded-2xl object-cover shadow-soft"
                />
                {s.openToMentor && (
                  <span className="absolute -bottom-1.5 -right-1.5 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-soft">
                    MENTOR
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate">{s.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {s.branch} · {s.year} year
                </div>
                {s.placementStatus === "Placed" && s.company && (
                  <div className="flex items-center gap-1.5 text-xs text-success font-semibold mt-1">
                    <Briefcase className="h-3.5 w-3.5" /> Placed @ {s.company}
                  </div>
                )}
                <p className="text-xs text-foreground/80 mt-2 line-clamp-2">{s.bio}</p>
              </div>
            </div>
            <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
              {s.interests.slice(0, 4).map((i) => (
                <InterestChip key={i} label={i} />
              ))}
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => {
                  toast.success(`Connection request sent to ${s.name.split(" ")[0]}!`);
                }}
                className="flex-1 bg-gradient-hero text-primary-foreground font-semibold text-sm py-2.5 rounded-xl shadow-soft hover:shadow-glow transition-smooth flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-4 w-4" /> Connect
              </button>
              <button
                onClick={() => onMessage(s.id)}
                aria-label={`Message ${s.name}`}
                className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-muted transition-smooth"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth",
      active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
    )}
  >
    {children}
  </button>
);

const QuickToggle = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-smooth flex items-center gap-1",
      active ? "bg-accent text-accent-foreground shadow-soft" : "bg-secondary text-secondary-foreground"
    )}
  >
    {children}
    {active && <X className="h-3 w-3" />}
  </button>
);