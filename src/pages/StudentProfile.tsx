import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Camera, GraduationCap, Hash, Loader2, LogOut, ShieldCheck, Sparkles, Target, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { InterestChip } from "@/components/campus/InterestChip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

const StudentProfile = () => {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Remove this account from the app on this device? Your data stays in the database.")) return;
    try {
      await supabase.auth.signOut();
    } finally {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") || k.includes("supabase"))
          .forEach((k) => localStorage.removeItem(k));
      } catch {}
      toast.success("Account removed from this app");
      window.location.href = "/";
    }
  };

  const eligibleForMentor = profile.placement_status === "Placed" || profile.placement_status === "Interning";

  const toggleMentor = async (next: boolean) => {
    if (next && !eligibleForMentor) {
      toast.error("Set your placement status to Placed or Interning first.");
      return;
    }
    const { error } = await supabase.from("profiles").update({ mentor_mode: next }).eq("id", user.id);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success(next ? "You're now a Mentor 🧑‍🏫" : "Switched back to Candidate");
  };

  const initials = (profile.name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (!user) { toast.error("Sign in to upload a photo"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please pick an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
      if (up.error) throw up.error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile photo updated!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    }
    finally { setUploading(false); }
  };

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
              <div className="relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-primary-foreground/20" />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-primary-foreground/20 ring-4 ring-primary-foreground/20 flex items-center justify-center font-bold text-2xl">{initials}</div>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change photo" className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-full bg-accent text-accent-foreground shadow-soft flex items-center justify-center hover:scale-105 transition-smooth disabled:opacity-60">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-bold leading-tight">{profile.name}</h2>
                  {profile.college_email_verified && <ShieldCheck className="h-4 w-4" />}
                </div>
                <p className="text-xs opacity-90 mt-0.5">{profile.branch ?? "—"} · {profile.year ?? "—"} year</p>
                {profile.bio && <p className="text-xs opacity-90 mt-2">{profile.bio}</p>}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <InfoRow Icon={Hash} label="User ID" value={user.id.slice(0, 8) + "…"} />
            <InfoRow Icon={GraduationCap} label="Branch & Year" value={`${profile.branch ?? "—"} · ${profile.year ?? "—"}`} />
          </div>

          {!!profile.interests?.length && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Interests</p>
              <div className="flex gap-1.5 flex-wrap">
                {profile.interests.map((i) => <InterestChip key={i} label={i} />)}
              </div>
            </div>
          )}

          {!!profile.skills?.length && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Skills</p>
              <div className="flex gap-1.5 flex-wrap">
                {profile.skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => navigate("/karma")} className="mt-4 w-full rounded-2xl border border-accent/40 bg-accent-soft p-4 flex items-center gap-3 hover:bg-accent-soft/70 transition-smooth">
            <Award className="h-5 w-5 text-accent" />
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">Placement Karma</p>
              <p className="text-[11px] text-muted-foreground">{profile.karma_total ?? 0} pts · view badges & leaderboard</p>
            </div>
            <span className="text-lg font-black text-accent">{profile.karma_total ?? 0}</span>
          </button>

          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-accent" /> Open to mentor: {profile.open_to_mentor ? "Yes" : "No"}
            </div>
            {profile.looking_for_mentor_in?.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-semibold mt-2">
                <Target className="h-4 w-4 text-accent" /> Looking for mentor in: {profile.looking_for_mentor_in.join(", ")}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-primary/30 bg-gradient-card p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-bold text-sm">Mentor mode</p>
                <p className="text-[11px] text-muted-foreground">
                  {profile.mentor_mode
                    ? "You're listed in the Mentor Directory."
                    : eligibleForMentor
                      ? "Switch on to help juniors via 1:1 chats."
                      : "Available once your status is Placed or Interning."}
                </p>
              </div>
              <Switch checked={profile.mentor_mode} disabled={!eligibleForMentor && !profile.mentor_mode} onCheckedChange={toggleMentor} />
            </div>
            <button onClick={() => navigate("/mentors")} className="mt-3 w-full py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-muted">
              Browse Mentor Directory
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-destructive text-destructive-foreground font-semibold text-sm shadow-soft hover:opacity-95 transition-smooth"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>

          <button
            onClick={handleDeleteAccount}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/40 text-destructive font-semibold text-sm hover:bg-destructive/10 transition-smooth"
          >
            <Trash2 className="h-4 w-4" /> Delete account from app
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            This removes the account locally only. Your records remain in the college database.
          </p>
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