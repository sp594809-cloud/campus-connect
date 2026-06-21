import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "moderator" | "recruiter" | "student";

const useHasRole = (role: AppRole) => {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["role", role, user?.id ?? null],
    enabled: !authLoading && !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: role,
      });
      if (error) throw error;
      return !!data;
    },
  });
  return { has: user ? !!data : false, loading: authLoading || (!!user && isLoading) };
};

/** True if the current user is an admin OR moderator (staff who can review reports). */
export const useStaffRole = () => {
  const admin = useHasRole("admin");
  const mod = useHasRole("moderator");
  return {
    isAdmin: admin.has,
    isModerator: mod.has,
    isStaff: admin.has || mod.has,
    loading: admin.loading || mod.loading,
  };
};

export const useAdminRole = () => {
  const r = useHasRole("admin");
  return { isAdmin: r.has, loading: r.loading };
};