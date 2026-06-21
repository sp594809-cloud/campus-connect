import { Search } from "lucide-react";

export const Header = ({
  title,
  subtitle,
  showSearch,
  onSearchClick,
}: {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
}) => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-5 pt-6 pb-3 border-b border-border/60">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {showSearch && (
            <button onClick={onSearchClick} aria-label="Search" className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-muted transition-smooth">
              <Search className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};