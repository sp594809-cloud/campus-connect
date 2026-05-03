import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ALL_INTERESTS } from "@/data/constants";
import { InterestChip } from "./InterestChip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import networkBg from "@/assets/network-bg.jpg";

const branches = ["CSE", "ECE", "ME", "EE", "CE", "IT", "Other"] as const;
const years = ["1st", "2nd", "3rd", "4th"] as const;

export const Onboarding = () => {
  const { user, refreshProfile, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.name ?? "");
  const [branch, setBranch] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [openToMentor, setOpenToMentor] = useState(false);
  const [mentorTopic, setMentorTopic] = useState("");
  const [busy, setBusy] = useState(false);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim() || "Student",
        branch: (branch || null) as "CSE" | "ECE" | "ME" | "EE" | "CE" | "IT" | "Other" | null,
        year: (year || null) as "1st" | "2nd" | "3rd" | "4th" | null,
        bio: bio.trim().slice(0, 200),
        interests,
        skills,
        open_to_mentor: openToMentor,
        looking_for_mentor_in: mentorTopic ? mentorTopic.split(",").map((s) => s.trim()).filter(Boolean) : [],
        onboarded: true,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Auto-join communities matching interests
    const { data: comms } = await supabase.from("communities").select("id, interest").in("interest", interests);
    if (comms?.length) {
      await supabase.from("community_members").upsert(
        comms.map((c) => ({ community_id: c.id, user_id: user.id })),
        { onConflict: "community_id,user_id" }
      );
    }
    toast.success("You're in! Welcome 🎉");
    refreshProfile();
  };

  const toggleInterest = (i: string) =>
    setInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  const addSkill = () => {
    const s = skill.trim();
    if (s && skills.length < 8 && !skills.includes(s)) setSkills([...skills, s]);
    setSkill("");
  };

  const canNext =
    step === 0 ? name.trim().length > 0 :
    step === 1 ? !!branch && !!year :
    step === 2 ? interests.length >= 3 :
    true;

  const steps = ["About", "Campus", "Interests", "Skills", "Mentorship"];

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
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-smooth",
                i <= step ? "bg-gradient-hero" : "bg-secondary"
              )}
            />
          ))}
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent">{steps[step]}</p>

        {step === 0 && (
          <div className="mt-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Hey there 👋</h2>
            <p className="text-sm text-muted-foreground mt-1">What should peers call you?</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              maxLength={80}
              className="mt-4 w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Short bio (optional) — what are you working on?"
              rows={3}
              className="mt-3 w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">{bio.length}/200</p>
          </div>
        )}

        {step === 1 && (
          <div className="mt-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Where on campus?</h2>
            <p className="text-sm text-muted-foreground mt-1">Pick your branch and year.</p>
            <p className="text-xs font-semibold mt-4 mb-2">Branch</p>
            <div className="flex gap-1.5 flex-wrap">
              {branches.map((b) => (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  className={cn(
                    "px-3.5 py-2 rounded-full text-sm font-semibold transition-smooth",
                    branch === b ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold mt-4 mb-2">Year</p>
            <div className="flex gap-1.5 flex-wrap">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={cn(
                    "px-3.5 py-2 rounded-full text-sm font-semibold transition-smooth",
                    year === y ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {y} year
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold">What lights you up?</h2>
            <p className="text-sm text-muted-foreground mt-1">Pick at least 3. We'll auto-join you to matching communities.</p>
            <div className="mt-4 flex gap-1.5 flex-wrap">
              {ALL_INTERESTS.map((i) => (
                <InterestChip key={i} label={i} active={interests.includes(i)} onClick={() => toggleInterest(i)} size="md" />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{interests.length} selected</p>
          </div>
        )}

        {step === 3 && (
          <div className="mt-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Your skills</h2>
            <p className="text-sm text-muted-foreground mt-1">What can you teach or build with? (optional)</p>
            <div className="mt-4 flex gap-2">
              <input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="e.g. React, PyTorch, Figma"
                maxLength={30}
                className="flex-1 px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={addSkill} className="px-4 rounded-2xl bg-foreground text-background font-semibold text-sm">Add</button>
            </div>
            <div className="mt-3 flex gap-1.5 flex-wrap">
              {skills.map((s) => (
                <button
                  key={s}
                  onClick={() => setSkills(skills.filter((x) => x !== s))}
                  className="px-3 py-1.5 rounded-full bg-accent-soft text-accent text-sm font-semibold"
                >
                  {s} ✕
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-2 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Mentorship</h2>
            <p className="text-sm text-muted-foreground mt-1">Help out, get help, or both.</p>
            <button
              onClick={() => setOpenToMentor((v) => !v)}
              className={cn(
                "mt-4 w-full p-4 rounded-2xl text-left transition-smooth",
                openToMentor ? "bg-gradient-hero text-primary-foreground shadow-glow" : "bg-secondary"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">I'm open to mentor juniors 🧑‍🏫</span>
                {openToMentor && <Check className="h-5 w-5" />}
              </div>
              <p className={cn("text-xs mt-1", openToMentor ? "opacity-90" : "text-muted-foreground")}>
                Juniors will be able to send you mentorship requests.
              </p>
            </button>
            <p className="text-xs font-semibold mt-4 mb-1">Looking for mentor in (optional)</p>
            <input
              value={mentorTopic}
              onChange={(e) => setMentorTopic(e.target.value)}
              placeholder="e.g. Placement Prep, System Design"
              className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Comma-separated topics.</p>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {step > 0 && (
            <button onClick={back} className="px-4 py-3 rounded-2xl bg-secondary text-sm font-semibold">Back</button>
          )}
          {step < 4 ? (
            <button
              onClick={next}
              disabled={!canNext}
              className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={busy}
              className="flex-1 py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Enter Campus Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
};