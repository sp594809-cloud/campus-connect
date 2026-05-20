import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode, useMemo } from "react";
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
  
  // Refs to avoid stale closures and track user ID for realtime callbacks
  const userIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  // Track if initial load is complete to prevent race conditions
  const initialLoadComplete = useRef(false);

  const loadProfile = useCallback(async (uid: string, isInitial = false) => {
    // Prevent concurrent profile loads
    if (loadingRef.current && isInitial) {
      return;
    }
    
    if (isInitial) {
      loadingRef.current = true;
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    
    // Always mark loading as false after attempt (with isInitial flag for intentional calls)
    if (isInitial) {
      loadingRef.current = false;
    }
    
    if (error) {
      console.error("[loadProfile]", error);
      setLoading(false);
      return;
    }
    
    setProfile((data as Profile) ?? null);
    
    // Only set loading false for initial load
    if (isInitial && !initialLoadComplete.current) {
      initialLoadComplete.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      const currentUser = sess?.user ?? null;
      setUser(currentUser);
      
      // Update the ref with current user ID
      userIdRef.current = currentUser?.id ?? null;
      
      if (currentUser) {
        // For auth state changes (login/logout), load profile without the initial flag
        // since we already have the session
        loadProfile(currentUser.id, false);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      const currentUser = s?.user ?? null;
      setSession(s);
      setUser(currentUser);
      userIdRef.current = currentUser?.id ?? null;
      
      if (currentUser) {
        // Initial session load - set loading to true first
        loadProfile(currentUser.id, true).finally(() => {
          initialLoadComplete.current = true;
          setLoading(false);
        });
      } else {
        initialLoadComplete.current = true;
        setLoading(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Notify when a senior earns Legacy karma (e.g. their advice helped a junior)
  useEffect(() => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    const ch = supabase
      .channel(`karma-${currentUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "karma_events", filter: `user_id=eq.${currentUserId}` }, (payload) => {
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
        // Use userIdRef to get current user ID, not stale closure variable
        if (userIdRef.current) {
          loadProfile(userIdRef.current, false);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, loadProfile]);

  return (
    <Ctx.Provider
      value={useMemo(() => ({
        user,
        session,
        profile,
        loading,
        refreshProfile: async () => {
          const uid = userIdRef.current;
          if (uid) {
            await loadProfile(uid, false);
          }
        },
        signOut: async () => {
          await supabase.auth.signOut();
          navigate("/auth", { replace: true });
        },
      }), [user, session, profile, loading, loadProfile, navigate])}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);