import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * High-contrast floating actions anchored bottom-right (thumb resting zone).
 * Sits above the BottomNav. Back-to-top fades in only after meaningful scroll
 * to avoid simultaneous visual noise.
 */
export const FloatingActions = ({ onChat }: { onChat?: () => void }) => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-2 pointer-events-none">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={cn(
          "pointer-events-auto h-11 w-11 rounded-full bg-foreground text-background shadow-elevated flex items-center justify-center transition-all duration-300",
          showTop ? "opacity-100 translate-y-0 animate-scale-in" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
      {onChat && (
        <button
          onClick={onChat}
          aria-label="Quick chat"
          className="pointer-events-auto h-13 w-13 h-14 w-14 rounded-full bg-gradient-cta text-accent-foreground shadow-glow flex items-center justify-center animate-pulse-glow"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};