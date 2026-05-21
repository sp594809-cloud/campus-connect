export const COMPANY_CATEGORIES = [
  { id: "product", label: "Product", emoji: "🚀", desc: "DSA · System Design", examples: "Google, Flipkart, Atlassian" },
  { id: "service", label: "Service", emoji: "🏢", desc: "Aptitude · Communication", examples: "TCS, Infosys, Wipro" },
  { id: "fintech", label: "Fintech", emoji: "💸", desc: "Quant · Backend · Security", examples: "Razorpay, CRED, Zerodha" },
  { id: "gcc", label: "GCC", emoji: "🌐", desc: "Domain · Behavioral", examples: "Goldman Sachs, Deloitte" },
  { id: "startup", label: "Startup", emoji: "⚡", desc: "Full-stack · Ownership", examples: "Early-stage Indian startups" },
  { id: "core", label: "Core", emoji: "🔧", desc: "Domain · GATE-style", examples: "L&T, BHEL, ISRO" },
] as const;

export type CompanyCategory = typeof COMPANY_CATEGORIES[number]["id"];

export const APPLICATION_SOURCES = [
  { id: "tpo", label: "TPO" },
  { id: "referral", label: "Referral" },
  { id: "off_campus", label: "Off-campus" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "pool_campus", label: "Pool Campus" },
] as const;

export const ROLE_TYPES = [
  { id: "internship", label: "Internship" },
  { id: "full_time", label: "Full-time" },
  { id: "ppo", label: "PPO" },
] as const;

export const OUTCOMES = [
  { id: "selected", label: "Selected", emoji: "🎉" },
  { id: "rejected", label: "Rejected", emoji: "💔" },
  { id: "waitlisted", label: "Waitlisted", emoji: "⏸" },
  { id: "withdrew", label: "Withdrew", emoji: "🚪" },
] as const;

export const ROUND_TYPES = [
  { id: "oa", label: "Online Assessment" },
  { id: "technical", label: "Technical" },
  { id: "system_design", label: "System Design" },
  { id: "managerial", label: "Managerial" },
  { id: "hr", label: "HR" },
  { id: "group_discussion", label: "Group Discussion" },
] as const;

export const QUESTION_TAGS = [
  "DSA", "DBMS", "OS", "CN", "OOP", "System Design",
  "Aptitude", "Puzzle", "SQL", "Behavioral", "Project Deep-dive", "CS Fundamentals",
];

export const DIFFICULTY = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
] as const;

export const INTERVIEWER_BEHAVIORS = [
  { id: "friendly", label: "Friendly", emoji: "😊" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "stress_test", label: "Stress test", emoji: "🔥" },
  { id: "rude", label: "Rude", emoji: "😠" },
] as const;