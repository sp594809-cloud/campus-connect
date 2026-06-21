export interface EmployabilityData {
  karma_total: number;
  current_streak: number;
  longest_streak: number;
  total_completed: number;
  interview_posts: number;
  posts_count: number;
  mentorships: number;
}

export interface EmployabilityScore {
  total: number;
  consistency: number;       // streaks
  peer: number;              // karma from helping
  technical: number;         // dsa
  community: number;         // posts + interview shares
}

export const computeScore = (d: EmployabilityData): EmployabilityScore => {
  const consistency = Math.min(100, Math.round((d.current_streak * 1.5) + (d.longest_streak * 0.5)));
  const peer = Math.min(100, Math.round(d.karma_total / 5));
  const technical = Math.min(100, Math.round(d.total_completed * 1.2));
  const community = Math.min(100, Math.round(d.posts_count * 4 + d.interview_posts * 8));
  const total = Math.min(100, Math.round(consistency * 0.25 + peer * 0.30 + technical * 0.25 + community * 0.20));
  return { total, consistency, peer, technical, community };
};

export const KARMA_CATEGORY = (action: string): string => {
  switch (action) {
    case "interview_post": return "interview_experience";
    case "advice_upvoted": return "community_help";
    case "mentorship_completed": return "mentorship";
    case "mock_interview": return "mock_interview";
    case "resume_review": return "mentorship";
    case "aspire_engage": return "dsa_completion";
    case "daily_streak": return "dsa_completion";
    default: return "community_help";
  }
};

export const CATEGORY_COLOR: Record<string, string> = {
  interview_experience: "hsl(var(--accent))",
  mentorship: "hsl(var(--primary))",
  mock_interview: "hsl(var(--warning))",
  dsa_completion: "hsl(var(--success))",
  marketplace_contribution: "hsl(280 80% 60%)",
  community_help: "hsl(200 70% 50%)",
};