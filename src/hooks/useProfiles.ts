import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicProfile {
  id: string;
  name: string;
  branch: string | null;
  year: string | null;
  bio: string;
  avatar_url: string | null;
  interests: string[];
  skills: string[];
  open_to_mentor: boolean;
  looking_for_mentor_in: string[];
  placement_status: "Placed" | "Looking" | "Interning" | "N/A";
  company: string | null;
  college_email_verified: boolean;
}

export const useProfiles = (excludeId?: string) => {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,name,branch,year,bio,avatar_url,interests,skills,open_to_mentor,looking_for_mentor_in,placement_status,company,college_email_verified")
        .eq("onboarded", true)
        .order("created_at", { ascending: false });
      if (alive) {
        setProfiles(((data ?? []) as PublicProfile[]).filter((p) => p.id !== excludeId));
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [excludeId]);

  return { profiles, loading };
};

export const avatarFor = (p: { avatar_url: string | null; name: string }) =>
  p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name)}&backgroundType=gradientLinear&backgroundColor=4f46e5,f97316`;