import { Github, Linkedin, Pencil, Settings, Sparkles, Target } from "lucide-react";
import { Header } from "../Header";
import { currentUser } from "@/data/mockData";
import { InterestChip } from "../InterestChip";

export const ProfileScreen = () => {
  const u = currentUser;
  return (
    <div className="animate-fade-in-up">
      <Header title="Profile" />

      <div className="px-5">
        <div className="rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
          <div className="flex items-start gap-4 relative">
            <img
              src={u.avatar}
              alt={u.name}
              className="h-20 w-20 rounded-2xl object-cover ring-4 ring-primary-foreground/20 shadow-soft"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold leading-tight">{u.name}</h2>
              <p className="text-sm opacity-90">{u.branch} · {u.year} year</p>
              <div className="flex gap-2 mt-2">
                {u.github && (
                  <a aria-label="GitHub" className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-smooth">
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {u.linkedin && (
                  <a aria-label="LinkedIn" className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-smooth">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                <button aria-label="Settings" className="ml-auto h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm opacity-95">{u.bio}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Connections" value="42" />
          <Stat label="Communities" value="3" />
          <Stat label="Posts" value="11" />
        </div>

        <Section icon={<Sparkles className="h-4 w-4" />} title="Interests">
          <div className="flex gap-1.5 flex-wrap">
            {u.interests.map((i) => <InterestChip key={i} label={i} size="md" />)}
          </div>
        </Section>

        <Section icon={<Pencil className="h-4 w-4" />} title="Skills">
          <div className="flex gap-1.5 flex-wrap">
            {u.skills.map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">{s}</span>
            ))}
          </div>
        </Section>

        <Section icon={<Target className="h-4 w-4" />} title="Looking for mentor in">
          <div className="flex gap-1.5 flex-wrap">
            {u.lookingForMentorIn?.map((m) => (
              <span key={m} className="px-3 py-1.5 rounded-full bg-accent-soft text-accent text-sm font-semibold">{m}</span>
            ))}
          </div>
        </Section>

        <button className="mt-5 w-full py-3 rounded-2xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-smooth">
          Edit profile
        </button>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-card border border-border p-3 text-center shadow-soft">
    <p className="text-xl font-bold">{value}</p>
    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
  </div>
);

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="mt-5">
    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
      {icon}
      <p className="text-xs font-bold uppercase tracking-wider">{title}</p>
    </div>
    {children}
  </div>
);