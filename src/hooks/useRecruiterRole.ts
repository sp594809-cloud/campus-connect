import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useRecruiterRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [isRecruiter, setIsRecruiter] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsRecruiter(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "recruiter" }).then(({ data }) => {
      setIsRecruiter(!!data);
    });
  }, [user?.id, authLoading]);

  return { isRecruiter, loading: authLoading || isRecruiter === null };
};