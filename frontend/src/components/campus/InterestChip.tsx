import { cn } from "@/lib/utils";

const palette: Record<string, string> = {
  "Coding": "bg-violet-100 text-violet-700",
  "AI/ML": "bg-fuchsia-100 text-fuchsia-700",
  "Robotics": "bg-rose-100 text-rose-700",
  "Web Dev": "bg-sky-100 text-sky-700",
  "Mobile Dev": "bg-cyan-100 text-cyan-700",
  "Cybersecurity": "bg-slate-200 text-slate-800",
  "Sports": "bg-emerald-100 text-emerald-700",
  "Music": "bg-pink-100 text-pink-700",
  "Photography": "bg-amber-100 text-amber-700",
  "Gaming": "bg-indigo-100 text-indigo-700",
  "Entrepreneurship": "bg-orange-100 text-orange-700",
  "Design": "bg-teal-100 text-teal-700",
  "Writing": "bg-yellow-100 text-yellow-800",
  "Finance": "bg-lime-100 text-lime-700",
};

export const InterestChip = ({
  label,
  size = "sm",
  active,
  onClick,
}: {
  label: string;
  size?: "sm" | "md";
  active?: boolean;
  onClick?: () => void;
}) => {
  const color = palette[label] ?? "bg-secondary text-secondary-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full font-medium transition-smooth whitespace-nowrap",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : color,
        onClick && "hover:scale-105 active:scale-95 cursor-pointer"
      )}
    >
      {label}
    </button>
  );
};