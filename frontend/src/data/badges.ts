export interface Badge {
  id: string;
  label: string;
  emoji: string;
  threshold: number;
  color: string;
}

export const BADGES: Badge[] = [
  { id: "rookie",      label: "Rookie",          emoji: "🌱", threshold: 0,    color: "from-stone-400 to-stone-500" },
  { id: "helper",      label: "Helper",          emoji: "🥉", threshold: 100,  color: "from-amber-600 to-amber-700" },
  { id: "contributor", label: "Contributor",     emoji: "🥈", threshold: 500,  color: "from-slate-300 to-slate-400" },
  { id: "mentor",      label: "Mentor",          emoji: "🥇", threshold: 1500, color: "from-yellow-400 to-amber-500" },
  { id: "dsa_master",  label: "DSA Master",      emoji: "💎", threshold: 3000, color: "from-cyan-400 to-blue-500" },
  { id: "pillar",      label: "Community Pillar",emoji: "🏛️", threshold: 6000, color: "from-violet-500 to-fuchsia-500" },
];

export const currentBadge = (k: number): Badge =>
  [...BADGES].reverse().find((b) => k >= b.threshold)!;

export const nextBadge = (k: number): Badge | null =>
  BADGES.find((b) => k < b.threshold) ?? null;