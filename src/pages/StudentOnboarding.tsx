import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ALL_INTERESTS } from "@/data/constants";
import { InterestChip } from "@/components/campus/InterestChip";
import { getStudentSession, type StudentSession } from "./Index";
import networkBg from "@/assets/network-bg.jpg";

const SESSION_KEY = "campus_student_session";
const branches = ["CSE", "ECE", "ME", "EE", "CE", "IT", "Other"] as const;
const years = ["1st", "2nd", "3rd", "4th"] as const;

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const session = getStudentSession();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [openToMentor, setOpenToMentor] = useState(false);
  const [mentorTopic, setMentorTopic] = useState("");

  useEffect(() => {
    if (!session) navigate("/", { replace: true });
    else if (session.onboarded) navigate("/campus", { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));
  const toggle = (i: string) =>
    setInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const addSkill = () => {
    const s = skill.trim();
    if (s && skills.length < 8 && !skills.includes(s)) setSkills([...skills, s]);
    setSkill("");
  };

  const finish = () => {
    const updated: StudentSession = {
      ...session,
      bio: bio.trim(),
      branch,
      year,
      interests,
      skills,
      open_to_mentor: openToMentor,
      looking_for_mentor_in: mentorTopic.trim(),
      onboarded: true,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    toast.success("You're in! Welcome 🎉");
    navigate("/campus", { replace: true });
  };

  const canNext =
    step === 0 ? !!branch && !!year :
    step === 1 ? interests.length >= 3 :
    true;

  const steps = ["Campus", "Interests", "Skills", "Mentorship"];

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
            <h2 className="text-2xl font-bold">Hey {session.full_name.split(" ")[0]} 👋</h2>
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

        <div className="mt-6 flex gap-2">
          {step > 0 && <button onClick={back} className="px-4 py-3 rounded-2xl bg-secondary text-sm font-semibold">Back</button>}
          {step < 3 ? (
            <button onClick={next} disabled={!canNext} className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={finish} className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> Enter Campus Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;