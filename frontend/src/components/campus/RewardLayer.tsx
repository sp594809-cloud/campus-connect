import { useEffect, useState } from "react";
import { onReward, type Reward } from "@/lib/rewards";
import { cn } from "@/lib/utils";

export const RewardLayer = () => {
  const [items, setItems] = useState<Reward[]>([]);

  useEffect(() => {
    return onReward((r) => {
      setItems((p) => [...p, r]);
      // gentle haptic-like vibration on supported devices
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(15); } catch {}
      }
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== r.id)), 1700);
    });
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-14 z-[200] flex justify-center">
      <div className="relative h-0 w-full max-w-md">
        {items.map((r) => (
          <div
            key={r.id}
            role="status"
            className={cn(
              "absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-bold text-sm shadow-elevated animate-float-up flex items-center gap-1.5",
              r.kind === "legacy"
                ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white"
                : "bg-gradient-to-r from-sky-500 to-indigo-500 text-white",
            )}
          >
            <span className="text-base">{r.kind === "legacy" ? "🏛️" : "🌱"}</span>
            <span>+{r.points}</span>
            <span className="text-xs opacity-90">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};