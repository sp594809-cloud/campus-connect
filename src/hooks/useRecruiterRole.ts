import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Cached recruiter-role check.
 * Server-enforced via has_role RPC + RLS — frontend value is for UX only.
 */
export const useRecruiterRole = () => {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["role", "recruiter", user?.id ?? null],
    enabled: !authLoading && !!user,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "recruiter",
      });
      if (error) throw error;
      return !!data;
    },
  });

  return {
    isRecruiter: user ? (data ?? null) : false,
    loading: authLoading || (!!user && isLoading),
  };
};