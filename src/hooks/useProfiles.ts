import { usePublicProfiles } from "@/lib/api/profiles";

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
  const { data, isLoading } = usePublicProfiles(excludeId);
  return { profiles: data ?? [], loading: isLoading };
};

// Brand-consistent avatar: Midnight Navy → Electric Purple gradient, Pearl White initials.
export const avatarFor = (p: { avatar_url: string | null; name: string }) =>
  p.avatar_url ||
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name)}` +
    `&backgroundType=gradientLinear` +
    `&backgroundColor=0a1a4d,a020f0` +
    `&backgroundRotation=135` +
    `&textColor=fafafa` +
    `&fontWeight=700`;