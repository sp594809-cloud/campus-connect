import { Calendar, Compass, Home, MessageCircle, ShoppingBag, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "home" | "discover" | "communities" | "events" | "marketplace" | "messages";

const items: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "discover", label: "Discover", Icon: Compass },
  { id: "marketplace", label: "Market", Icon: ShoppingBag },
  { id: "communities", label: "Groups", Icon: Users },
  { id: "events", label: "Events", Icon: Calendar },
  { id: "messages", label: "Chats", Icon: MessageCircle },
];

export const BottomNav = ({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) => {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-3 pb-3"
      aria-label="Primary"
    >
      <div className="glass-card rounded-3xl shadow-elevated px-2 py-2 flex items-center justify-between">
        {items.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded-2xl transition-smooth min-w-[52px]",
                isActive ? "" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center transition-smooth",
                  isActive ? "bg-gradient-hero text-white shadow-glow" : ""
                )}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none",
                  isActive ? "text-gradient-hero" : ""
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};