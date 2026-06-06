import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2, Sparkles, ShieldCheck, Globe, Users as UsersIcon, Lock, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ALL_INTERESTS } from "@/data/constants";
import { InterestChip } from "@/components/campus/InterestChip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import networkBg from "@/assets/network-bg.jpg";

const branches = ["CSE", "ECE", "ME", "EE", "CE", "IT", "Other"] as const;
const years = ["1st", "2nd", "3rd", "4th"] as const;

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const { session, profile, loading, refreshProfile, user } = useAuth();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [openToMentor, setOpenToMentor] = useState(false);
  const [mentorTopic, setMentorTopic] = useState("");
  const [discoverable, setDiscoverable] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "connections" | "private">("connections");
  const [consent, setConsent] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) navigate("/", { replace: true });
    else if (profile?.onboarded && (profile as unknown as { consent_acknowledged?: boolean }).consent_acknowledged) {
      navigate("/campus", { replace: true });
    } else if (profile?.onboarded) {
      setStep(5);
    }
  }, [session, profile, loading, navigate]);

  if (loading || !session || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));
  const toggle = (i: string) =>
    setInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const addSkill = () => {
    const s = skill.trim();
    if (s && skills.length < 8 && !skills.includes(s)) setSkills([...skills, s]);
    setSkill("");
  };

  const finish = async () => {
    if (!user) { navigate("/", { replace: true }); return; }
    if (!consent) { toast.error("Please acknowledge the notice to continue."); return; }
    setFinishing(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        bio: bio.trim(),
        branch: branch as any,
        year: year as any,
        interests,
        skills,
        open_to_mentor: openToMentor,
        looking_for_mentor_in: mentorTopic.trim() ? [mentorTopic.trim()] : [],
        onboarded: true,
        discoverable,
        profile_visibility: visibility,
        consent_acknowledged: true,
        consent_acknowledged_at: new Date().toISOString(),
      } as any)
      .eq("id", user.id);
    setFinishing(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("You're in! Welcome 🎉");
    navigate("/campus", { replace: true });
  };

  const canNext =
    step === 0 ? !!branch && !!year :
    step === 1 ? interests.length >= 3 :
    step === 3 ? true :
    true;

  const steps = ["Campus", "Interests", "Skills", "Mentorship", "Privacy", "Notice"];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(234 70% 18% / 0.95), hsl(264 75% 30% / 0.92)), url(${networkBg})`,
        backgroundSize: "cover",
      }}
    >
      <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated p-6 animate-scale-in">
        <div className="flex items-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-smooth", i <= step ? "bg-gradient-hero" : "bg-secondary")} />
          ))}
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent">{steps[step]}</p>

        {step === 0 && (
          <div className="mt-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Hey {profile.name.split(" ")[0]} 👋</h2>
            <p className="text-sm text-muted-foreground mt-1">Tell us where you are on campus.</p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Short bio (optional)"
              rows={3}
              className="mt-4 w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <p className="text-xs font-semibold mt-4 mb-2">Branch</p>
            <div className="flex gap-1.5 flex-wrap">
              {branches.map((b) => (
                <button key={b} onClick={() => setBranch(b)} className={cn("px-3.5 py-2 rounded-full text-sm font-semibold transition-smooth", branch === b ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>{b}</button>
              ))}
            </div>
            <p className="text-xs font-semibold mt-4 mb-2">Year</p>
            <div className="flex gap-1.5 flex-wrap">
              {years.map((y) => (
                <button key={y} onClick={() => setYear(y)} className={cn("px-3.5 py-2 rounded-full text-sm font-semibold transition-smooth", year === y ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>{y} year</button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold">What lights you up?</h2>
            <p className="text-sm text-muted-foreground mt-1">Pick at least 3.</p>
            <div className="mt-4 flex gap-1.5 flex-wrap">
              {ALL_INTERESTS.map((i) => (
                <InterestChip key={i} label={i} active={interests.includes(i)} onClick={() => toggle(i)} size="md" />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{interests.length} selected</p>
          </div>
        )}

        {step === 2 && (
          <div className="mt-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Your skills</h2>
            <p className="text-sm text-muted-foreground mt-1">What can you teach or build with? (optional)</p>
            <div className="mt-4 flex gap-2">
              <input value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="e.g. React, PyTorch, Figma" maxLength={30} className="flex-1 px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={addSkill} className="px-4 rounded-2xl bg-foreground text-background font-semibold text-sm">Add</button>
            </div>
            <div className="mt-3 flex gap-1.5 flex-wrap">
              {skills.map((s) => (
                <button key={s} onClick={() => setSkills(skills.filter((x) => x !== s))} className="px-3 py-1.5 rounded-full bg-accent-soft text-accent text-sm font-semibold">{s} ✕</button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Mentorship</h2>
            <p className="text-sm text-muted-foreground mt-1">Help out, get help, or both.</p>
            <button onClick={() => setOpenToMentor((v) => !v)} className={cn("mt-4 w-full p-4 rounded-2xl text-left transition-smooth", openToMentor ? "bg-gradient-hero text-primary-foreground shadow-glow" : "bg-secondary")}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">I'm open to mentor juniors 🧑‍🏫</span>
                {openToMentor && <Check className="h-5 w-5" />}
              </div>
              <p className={cn("text-xs mt-1", openToMentor ? "opacity-90" : "text-muted-foreground")}>Juniors will be able to send you mentorship requests.</p>
            </button>
            <p className="text-xs font-semibold mt-4 mb-1">Looking for mentor in (optional)</p>
            <input value={mentorTopic} onChange={(e) => setMentorTopic(e.target.value)} placeholder="e.g. Placement Prep, System Design" className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        )}

        {step === 4 && (
          <div className="mt-2 animate-fade-in-up">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="text-2xl font-bold">Your privacy</h2></div>
            <p className="text-sm text-muted-foreground mt-1">By default your profile is private. You decide who finds you.</p>

            <button onClick={() => setDiscoverable((v) => !v)} className={cn("mt-4 w-full p-4 rounded-2xl text-left transition-smooth", discoverable ? "bg-gradient-hero text-primary-foreground shadow-glow" : "bg-secondary")}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Appear in Discover</span>
                {discoverable && <Check className="h-5 w-5" />}
              </div>
              <p className={cn("text-xs mt-1", discoverable ? "opacity-90" : "text-muted-foreground")}>Off by default. When on, other students can find you in interest-based search.</p>
            </button>

            <p className="text-xs font-semibold mt-4 mb-2">Who can view your profile</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "public", icon: Globe, label: "Anyone" },
                { v: "connections", icon: UsersIcon, label: "Connections" },
                { v: "private", icon: Lock, label: "Only me" },
              ] as const).map(({ v, icon: Icon, label }) => (
                <button key={v} onClick={() => setVisibility(v)} className={cn("rounded-2xl border p-3 text-xs font-semibold flex flex-col items-center gap-1 transition-smooth", visibility === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-secondary-foreground")}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">You can change these any time in Profile → Privacy.</p>
          </div>
        )}

        {step === 5 && (
          <div className="mt-2 animate-fade-in-up">
            <div className="flex items-center gap-2"><FileWarning className="h-5 w-5 text-warning" /><h2 className="text-2xl font-bold">One last thing</h2></div>
            <p className="text-sm text-muted-foreground mt-1">Please read carefully — this is required to enter CampusOS.</p>

            <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/5 p-4 text-sm leading-relaxed text-foreground">
              <p className="font-semibold mb-2">Accountable identity notice</p>
              <p>
                Everything you post, message, or list on CampusOS is linked to your enrollment number
                and your college identity. In cases of reported misconduct, your activity may be
                reviewed by college administration.
              </p>
            </div>

            <label className="mt-4 flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
              <span className="text-sm">
                I understand and accept that my activity on CampusOS is tied to my college identity
                and may be reviewed by administration if reported.
              </span>
            </label>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {step > 0 && step < 5 && <button onClick={back} className="px-4 py-3 rounded-2xl bg-secondary text-sm font-semibold">Back</button>}
          {step < 4 ? (
            <button onClick={next} disabled={!canNext} className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : step === 4 ? (
            <button onClick={() => setStep(5)} className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={!consent || finishing} className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
              {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Enter CampusOS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;