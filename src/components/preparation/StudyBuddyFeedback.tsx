import { useState } from 'react';
import { XCircle, CheckCircle, RotateCcw, Eye, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudyBuddyFeedbackProps {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
  onTryAgain: () => void;
  onShowAnswer: () => void;
  className?: string;
}

export function StudyBuddyFeedback({
  isCorrect,
  selectedAnswer,
  correctAnswer,
  explanation,
  onTryAgain,
  onShowAnswer,
  className,
}: StudyBuddyFeedbackProps) {
  return (
    <div className={cn("rounded-xl overflow-hidden", className)}>
      {/* Result Header */}
      <div
        className={cn(
          "px-4 py-3 flex items-center gap-2",
          isCorrect
            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
            : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
        )}
      >
        {isCorrect ? (
          <>
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">🎉 Correct!</span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">❌ Oops! Let's learn why...</span>
          </>
        )}
      </div>

      {/* Answer Details */}
      <div className="p-4 bg-card border-x border-b border-border">
        {/* Selected vs Correct */}
        <div className="mb-3">
          {!isCorrect && selectedAnswer && (
            <div className="text-sm mb-2">
              <span className="text-muted-foreground">Your answer: </span>
              <span className="line-through text-red-500">{selectedAnswer}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-muted-foreground">Correct answer: </span>
            <span className={cn(
              "font-semibold",
              isCorrect ? "text-green-600" : "text-green-600"
            )}>
              {correctAnswer}
            </span>
          </div>
        </div>

        {/* Study Buddy Explanation */}
        <div className="p-3 rounded-lg bg-muted/50 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold">📚 Study Buddy Says:</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isCorrect && (
            <button
              onClick={onTryAgain}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              ↻ Try Again
            </button>
          )}
          
          <button
            onClick={onShowAnswer}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
              isCorrect
                ? "w-full bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border hover:bg-muted"
            )}
          >
            {isCorrect ? "Continue →" : "Show Answer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudyBuddyFeedback;