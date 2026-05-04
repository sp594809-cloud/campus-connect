import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, Hash, LogOut, Phone, ShieldCheck, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { getStudentSession } from "./Index";
import { InterestChip } from "@/components/campus/InterestChip";

const StudentProfile = () => {
  const navigate = useNavigate();
  const session = getStudentSession();

  useEffect(() => {
    if (!session) navigate("/", { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const handleLogout = () => {
    localStorage.removeItem("campus_student_session");
    toast.success("Logged out");
    navigate("/", { replace: true });
  };

  const initials = session.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
      <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-elevated">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
          <button onClick={() => navigate("/campus")} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-bold text-base ml-2">Profile</h1>
        </div>

        <div className="p-5">
          <div className="rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
            <div className="flex items-start gap-4 relative">
              <div className="h-20 w-20 rounded-2xl bg-primary-foreground/20 ring-4 ring-primary-foreground/20 flex items-center justify-center font-bold text-2xl">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-bold leading-tight">{session.full_name}</h2>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-xs opacity-90 mt-0.5">{session.branch ?? "—"} · {session.year ?? "—"} year</p>
                {session.bio && <p className="text-xs opacity-90 mt-2">{session.bio}</p>}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <InfoRow Icon={Hash} label="Enrollment ID" value={session.enrollment_id} />
            <InfoRow Icon={Phone} label="Phone" value={session.phone_number} />
            <InfoRow Icon={GraduationCap} label="Branch & Year" value={`${session.branch ?? "—"} · ${session.year ?? "—"}`} />
          </div>

          {!!session.interests?.length && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Interests</p>
              <div className="flex gap-1.5 flex-wrap">
                {session.interests.map((i) => <InterestChip key={i} label={i} />)}
              </div>
            </div>
          )}

          {!!session.skills?.length && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Skills</p>
              <div className="flex gap-1.5 flex-wrap">
                {session.skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-accent" /> Open to mentor: {session.open_to_mentor ? "Yes" : "No"}
            </div>
            {session.looking_for_mentor_in && (
              <div className="flex items-center gap-2 text-sm font-semibold mt-2">
                <Target className="h-4 w-4 text-accent" /> Looking for mentor in: {session.looking_for_mentor_in}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-destructive text-destructive-foreground font-semibold text-sm shadow-soft hover:opacity-95 transition-smooth"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ Icon, label, value }: { Icon: typeof Hash; label: string; value: string }) => (
  <div className="flex items-center gap-3 p-3 bg-secondary rounded-2xl">
    <Icon className="h-5 w-5 text-primary" />
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  </div>
);

export default StudentProfile;