import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicProfile, MiniProfile } from "@/core/types";

export const PROFILE_PUBLIC_COLS =
  "id,name,branch,year,bio,avatar_url,interests,skills,open_to_mentor,looking_for_mentor_in,placement_status,company,college_email_verified";

export const PROFILE_MINI_COLS = "id,name,avatar_url,branch,year";

export async function fetchProfilesByIds(ids: string[]): Promise<MiniProfile[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_MINI_COLS)
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as MiniProfile[];
}

export async function fetchPublicProfilesByIds(ids: string[]): Promise<PublicProfile[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_PUBLIC_COLS)
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as unknown as PublicProfile[];
}

export function useProfilesByIds(ids: string[]) {
  const key = [...ids].sort();
  return useQuery({
    queryKey: ["profiles", "mini", key],
    queryFn: () => fetchProfilesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
  });
}

export function usePublicProfiles(excludeId?: string) {
  return useQuery<PublicProfile[]>({
    queryKey: ["profiles", "public", "all", excludeId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_PUBLIC_COLS)
        .eq("onboarded", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as PublicProfile[]).filter((p) => p.id !== excludeId);
    },
    staleTime: 30_000,
  });
}

export function useMentors(excludeId?: string) {
  return useQuery<PublicProfile[]>({
    queryKey: ["profiles", "mentors", excludeId ?? null],
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select(PROFILE_PUBLIC_COLS)
        .eq("open_to_mentor", true);
      if (excludeId) q = q.neq("id", excludeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PublicProfile[];
    },
    staleTime: 30_000,
  });
}
