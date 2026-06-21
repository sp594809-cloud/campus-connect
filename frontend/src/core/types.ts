/**
 * Core domain types shared across the application.
 * Centralized type definitions to avoid circular dependencies.
 */

// Profile types
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

export interface MiniProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  branch?: string | null;
  year?: string | null;
}
