import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Hint {
  text: string;
  codeSnippet?: string;
}

interface ProgressiveHintsProps {
  hints: Hint[];
  maxRevealed?: number;
  onHintReveal?: (level: number) => void;
  className?: string;
}

export function ProgressiveHints({
  hints,
  maxRevealed = 0,
  onHintReveal,
  className,
}: ProgressiveHintsProps) {
  const [revealedCount, setRevealedCount] = useState(maxRevealed);
  const totalHints = hints.length;

  const handleRevealNext = () => {
    if (revealedCount < totalHints) {
      setRevealedCount(revealedCount + 1);
      onHintReveal?.(revealedCount);
    }
  };

  const handleReset = () => {
    setRevealedCount(maxRevealed);
  };

  // All hint levels revealed
  const allRevealed = revealedCount >= totalHints;

  return (
    <div className={cn("rounded-xl bg-card border border-border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">🆘 Need Help?</span>
        </div>
        
        {/* Progress indicator */}
        <span className="text-xs text-muted-foreground">
          {revealedCount}/{totalHints} hints
        </span>
      </div>

      {/* Revealed hints */}
      {revealedCount > 0 && (
        <div className="space-y-2 mb-3">
          {hints.slice(0, revealedCount).map((hint, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-lg text-sm",
                idx === revealedCount - 1
                  ? "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800"
                  : "bg-muted/50"
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-orange-500 font-semibold text-xs">
                  💡 Hint {idx + 1}:
                </span>
                <span className="text-foreground">{hint.text}</span>
              </div>
              
              {hint.codeSnippet && (
                <pre className="mt-2 p-2 rounded bg-background border text-xs overflow-x-auto">
                  <code>{hint.codeSnippet}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!allRevealed ? (
          <button
            onClick={handleRevealNext}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
          >
            ✨ Show Hint {revealedCount + 1}
          </button>
        ) : (
          <div className="flex-1 py-2 px-3 rounded-lg text-sm text-center bg-muted text-muted-foreground">
            🎯 All hints revealed!
          </div>
        )}

        {revealedCount > maxRevealed && (
          <button
            onClick={handleReset}
            className="py-2 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Standalone "I'm Stuck" button component
 * for use outside ProgressiveHints
 */
interface StuckButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function StuckButton({ onClick, disabled, className }: StuckButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
        "border border-orange-200 dark:border-orange-800",
        "text-orange-600 dark:text-orange-400",
        "hover:bg-orange-50 dark:hover:bg-orange-950/30",
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <HelpCircle className="h-4 w-4" />
      🆘 I'm Stuck - Show Me a Hint
    </button>
  );
}

export default ProgressiveHints;