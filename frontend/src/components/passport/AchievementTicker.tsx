import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

export const AchievementTicker = ({ items }: { items: string[] }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 2800);
    return () => clearInterval(id);
  }, [items.length]);
  if (!items.length) return null;
  return (
    <div className="relative overflow-hidden rounded-full border border-accent/30 bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 px-4 py-2 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Trophy className="h-3.5 w-3.5 text-accent flex-shrink-0 animate-pulse" />
        <div key={i} className="truncate animate-fade-in">{items[i]}</div>
      </div>
    </div>
  );
};