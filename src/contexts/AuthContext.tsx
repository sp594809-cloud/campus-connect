import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emitReward } from "@/lib/rewards";

export interface Profile {
  id: string;
  name: string;
  username: string | null;
  branch: string | null;
  year: string | null;
  bio: string;
  avatar_url: string | null;
  github: string | null;
  linkedin: string | null;
  interests: string[];
  skills: string[];
  open_to_mentor: boolean;
  looking_for_mentor_in: string[];
  placement_status: "Placed" | "Looking" | "Interning" | "N/A";
  company: string | null;
  college_email_verified: boolean;
  onboarded: boolean;
  mentor_mode: boolean;
  weekly_capacity: number;
  mentor_bio: string | null;
  mentor_topics: string[];
  karma_total: number;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

type KarmaAction =
  | "advice_upvoted"
  | "interview_post"
  | "mentorship_completed"
  | "resume_review"
  | "mock_interview"
  | "aspire_engage"
  | "daily_streak"
  | string;

interface KarmaEventRow {
  id?: string;
  user_id?: string;
  action?: KarmaAction;
  points?: number;
  note?: string | null;
  created_at?: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      console.error("[loadProfile]", error);
      return;
    }
    setProfile((data as Profile) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadProfile(sess.user.id);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Notify when a senior earns Legacy karma (e.g. their advice helped a junior)
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`karma-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "karma_events", filter: `user_id=eq.${user.id}` }, (payload) => {
        const e = (payload.new ?? {}) as KarmaEventRow;
        if (!e?.action || typeof e.points !== "number") return;
        const LEGACY = new Set(["advice_upvoted", "interview_post", "mentorship_completed", "resume_review", "mock_interview"]);
        const kind: "aspire" | "legacy" = LEGACY.has(e.action) ? "legacy" : "aspire";
        const label =
          e.action === "advice_upvoted" ? "advice helped a junior" :
          e.action === "interview_post" ? "interview shared" :
          e.action === "mentorship_completed" ? "mentorship done" :
          e.action === "aspire_engage" ? "engagement" :
          e.action === "daily_streak" ? "daily streak" :
          "karma";
        emitReward(e.points, label, kind);
        if (e.action === "advice_upvoted") toast.success(`Your advice helped a junior! +${e.points} Legacy`);
        loadProfile(user.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        profile,
        loading,
        refreshProfile: async () => user && loadProfile(user.id),
        signOut: async () => {
          await supabase.auth.signOut();
          navigate("/auth", { replace: true });
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);