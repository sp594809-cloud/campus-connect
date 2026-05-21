import { Github, LogOut, Pencil, Settings, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Header } from "../Header";
import { useAuth } from "@/contexts/AuthContext";
import { avatarFor } from "@/hooks/useProfiles";
import { InterestChip } from "../InterestChip";

export const ProfileScreen = () => {
  const { profile, signOut } = useAuth();
  if (!profile) return null;
  return (
    <div className="animate-fade-in-up">
      <Header title="Profile" />
      <div className="px-5">
        <div className="rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
          <div className="flex items-start gap-4 relative">
            <img src={avatarFor(profile)} alt={profile.name} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-primary-foreground/20 shadow-soft" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold leading-tight">{profile.name}</h2>
                {profile.college_email_verified && <ShieldCheck className="h-4 w-4" />}
              </div>
              <p className="text-sm opacity-90">{profile.branch ?? "—"} · {profile.year ?? "—"} year</p>
              <div className="flex gap-2 mt-2">
                <button aria-label="Settings" className="ml-auto h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center"><Settings className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          {profile.bio && <p className="mt-4 text-sm opacity-95">{profile.bio}</p>}
        </div>

        <Section icon={<Sparkles className="h-4 w-4" />} title="Interests">
          <div className="flex gap-1.5 flex-wrap">
            {profile.interests.map((i) => <InterestChip key={i} label={i} size="md" />)}
            {profile.interests.length === 0 && <p className="text-sm text-muted-foreground">None yet</p>}
          </div>
        </Section>

        <Section icon={<Pencil className="h-4 w-4" />} title="Skills">
          <div className="flex gap-1.5 flex-wrap">
            {profile.skills.map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">{s}</span>
            ))}
            {profile.skills.length === 0 && <p className="text-sm text-muted-foreground">None yet</p>}
          </div>
        </Section>

        {profile.looking_for_mentor_in.length > 0 && (
          <Section icon={<Target className="h-4 w-4" />} title="Looking for mentor in">
            <div className="flex gap-1.5 flex-wrap">
              {profile.looking_for_mentor_in.map((m) => (
                <span key={m} className="px-3 py-1.5 rounded-full bg-accent-soft text-accent text-sm font-semibold">{m}</span>
              ))}
            </div>
          </Section>
        )}

        <button onClick={signOut} className="mt-6 w-full py-3 rounded-2xl bg-secondary text-secondary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted transition-smooth">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
};

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="mt-5">
    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
      {icon}<p className="text-xs font-bold uppercase tracking-wider">{title}</p>
    </div>
    {children}
  </div>
);