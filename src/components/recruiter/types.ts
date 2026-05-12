export interface ScoreRow {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  branch: string | null;
  year: string | null;
  college_name: string | null;
  graduation_year: number | null;
  placement_status: string;
  company: string | null;
  verified: boolean;
  skills: string[] | null;
  karma_total: number;
  current_streak: number;
  longest_streak: number;
  total_completed: number;
  interview_posts_count: number;
  posts_count: number;
  employability_score: number;
}

export interface TalentFilterState {
  branch: string;
  graduation_year: string;
  placement_status: string;
  college_name: string;
  verified: "any" | "yes" | "no";
  skill: string;
  minStreak: number;
  minKarma: number;
  search: string;
}

export const DEFAULT_FILTERS: TalentFilterState = {
  branch: "any",
  graduation_year: "any",
  placement_status: "any",
  college_name: "",
  verified: "any",
  skill: "",
  minStreak: 0,
  minKarma: 0,
  search: "",
};