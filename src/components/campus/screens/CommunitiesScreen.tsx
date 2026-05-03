import { Users } from "lucide-react";
import { Header } from "../Header";
import { communities } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export const CommunitiesScreen = () => {
  const [joined, setJoined] = useState<Record<string, boolean>>({ c1: true, c3: true, c5: true });

  return (
    <div className="animate-fade-in-up">
      <Header title="Communities" subtitle="Tribes built around what you love" />

      <div className="px-5 mt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Your communities</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {communities.filter((c) => joined[c.id]).map((c) => (
            <div
              key={c.id}
              className={cn(
                "min-w-[140px] rounded-2xl p-3 text-white shadow-soft bg-gradient-to-br",
                c.color
              )}
            >
              <div className="text-2xl">{c.emoji}</div>
              <p className="text-sm font-bold mt-1 leading-tight">{c.name}</p>
              <p className="text-[11px] opacity-80 mt-0.5">{c.members} members</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Explore all</p>
        <div className="space-y-3">
          {communities.map((c, i) => (
            <div
              key={c.id}
              className="rounded-2xl bg-card border border-border/60 shadow-soft p-4 flex items-center gap-3 animate-fade-in-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className={cn("h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-soft", c.color)}>
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Users className="h-3 w-3" /> {c.members}
                </p>
              </div>
              <button
                onClick={() => {
                  setJoined((p) => ({ ...p, [c.id]: !p[c.id] }));
                  toast.success(joined[c.id] ? `Left ${c.name}` : `Joined ${c.name}!`);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-smooth",
                  joined[c.id]
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground hover:shadow-glow"
                )}
              >
                {joined[c.id] ? "Joined" : "Join"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};