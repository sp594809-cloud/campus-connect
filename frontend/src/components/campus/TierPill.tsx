import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { currentBadge, nextBadge } from "@/data/badges";
import { cn } from "@/lib/utils";

export const TierPill = () => {
  const nav = useNavigate();
  const { profile } = useAuth();
  if (!profile) return null;
  const k = profile.karma_total ?? 0;
  const cur = currentBadge(k);
  const nxt = nextBadge(k);
  const progress = nxt ? Math.min(100, ((k - cur.threshold) / (nxt.threshold - cur.threshold)) * 100) : 100;
  return (
    <button
      onClick={() => nav("/karma")}
      aria-label={`Tier ${cur.label}, ${k} karma. Tap to view.`}
      className={cn("group flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-soft bg-gradient-to-r transition-smooth hover:scale-105", cur.color)}
    >
      <span className="text-sm leading-none">{cur.emoji}</span>
      <span className="tabular-nums">{k}</span>
      {nxt && (
        <span className="ml-1 hidden xs:inline-block w-8 h-1 rounded-full bg-white/30 overflow-hidden">
          <span className="block h-full bg-white" style={{ width: `${progress}%` }} />
        </span>
      )}
    </button>
  );
};