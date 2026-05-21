import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle, XCircle, Clock, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Question = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type Difficulty = 'easy' | 'medium' | 'hard';

interface ProgressiveQuizProps {
  questions: Question[];
  topicName: string;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

export type QuizResult = {
  topicId: string;
  difficulty: Difficulty;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
};

export function ProgressiveQuiz({ questions, topicName, onComplete, onExit }: ProgressiveQuizProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [results, setResults] = useState<{ questionId: string; correct: boolean }[]>([]);

  // Group by difficulty
  const easyQuestions = questions.filter(q => q.difficulty === 'easy');
  const mediumQuestions = questions.filter(q => q.difficulty === 'medium');
  const hardQuestions = questions.filter(q => q.difficulty === 'hard');

  const getQuestionsForDifficulty = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return easyQuestions;
      case 'medium': return mediumQuestions;
      case 'hard': return hardQuestions;
    }
  };

  const currentQuestions = getQuestionsForDifficulty(difficulty);
  const currentQuestion = currentQuestions[currentIdx] || null;
  const isLastQuestion = currentIdx >= currentQuestions.length - 1;
  const isLastDifficulty = difficulty === 'hard' || (difficulty === 'medium' && hardQuestions.length === 0);
  const isLastInDifficulty = isLastQuestion && difficulty !== 'hard';

  const handleSelectOption = (optionId: string) => {
    if (isSubmitted) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption || !currentQuestion) return;
    
    const isCorrect = selectedOption === currentQuestion.correctOptionId;
    setResults(prev => [...prev, { questionId: currentQuestion.id, correct: isCorrect }]);
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (!isSubmitted) return;
    
    if (isLastQuestion) {
      // Move to next difficulty level
      if (difficulty === 'easy' && mediumQuestions.length > 0) {
        setDifficulty('medium');
        setCurrentIdx(0);
      } else if (difficulty === 'medium' && hardQuestions.length > 0) {
        setDifficulty('hard');
        setCurrentIdx(0);
      } else {
        // Quiz complete
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const correctCount = results.filter(r => r.correct).length + (selectedOption === currentQuestion!.correctOptionId ? 1 : 0);
        const totalQuestions = currentQuestions.length;
        
        onComplete({
          topicId: topicName,
          difficulty,
          totalQuestions,
          correctAnswers: correctCount,
          timeSpent,
        });
        return;
      }
    } else {
      setCurrentIdx(prev => prev + 1);
    }
    
    setSelectedOption(null);
    setIsSubmitted(false);
  };

  if (!currentQuestion) {
    return (
      <div className="p-4 text-center">
        <p>No questions available for this topic.</p>
        <button onClick={onExit} className="mt-4 btn-primary">Go Back</button>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQuestion.correctOptionId;
  const hasSelectedAnswer = selectedOption !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onExit} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-sm font-medium capitalize">{difficulty}</div>
          <div className="text-xs text-muted-foreground">
            Question {currentIdx + 1} of {currentQuestions.length}
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* Difficulty Progress */}
      <div className="px-4 py-2 flex gap-1">
        {(easyQuestions.length > 0 ? ['easy', 'medium', 'hard'] : []).slice(0, ['easy', 'medium', 'hard'].indexOf(difficulty) + 1).map((d, i) => {
          const diff = d as Difficulty;
          const done = getQuestionsForDifficulty(diff).length > 0 && (diff !== difficulty || isSubmitted);
          return (
            <div
              key={diff}
              className={cn(
                "flex-1 h-1.5 rounded-full",
                done ? "bg-green-500" : diff === difficulty ? "bg-primary" : "bg-secondary"
              )}
            />
          );
        })}
      </div>

      {/* Question */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-2">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            difficulty === 'easy' && "bg-green-500/20 text-green-500",
            difficulty === 'medium' && "bg-yellow-500/20 text-yellow-500",
            difficulty === 'hard' && "bg-red-500/20 text-red-500"
          )}>
            {difficulty.toUpperCase()}
          </span>
        </div>
        
        <h3 className="text-lg font-medium mb-6">{currentQuestion.text}</h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            let optionClass = "border-border bg-card";
            
            if (isSubmitted) {
              if (option.id === currentQuestion.correctOptionId) {
                optionClass = "border-green-500 bg-green-500/10";
              } else if (option.id === selectedOption && option.id !== currentQuestion.correctOptionId) {
                optionClass = "border-red-500 bg-red-500/10";
              }
            } else if (option.id === selectedOption) {
              optionClass = "border-primary bg-primary/10";
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={isSubmitted}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3",
                  optionClass,
                  !isSubmitted && "hover:border-primary/50 cursor-pointer",
                  isSubmitted && "cursor-default"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                  selectedOption === option.id ? "border-primary" : "border-muted-foreground",
                  isSubmitted && option.id === currentQuestion.correctOptionId && "border-green-500 bg-green-500",
                  isSubmitted && option.id !== currentQuestion.correctOptionId && selectedOption === option.id && "border-red-500 bg-red-500"
                )}>
                  {isSubmitted && option.id === currentQuestion.correctOptionId && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                  {isSubmitted && option.id !== currentQuestion.correctOptionId && selectedOption === option.id && (
                    <XCircle className="w-4 h-4 text-white" />
                  )}
                </div>
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {isSubmitted && (
          <div className={cn(
            "mt-6 p-4 rounded-xl",
            isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"
          )}>
            <div className="flex items-center gap-2 font-medium mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-500">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500">Incorrect</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t bg-background">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!hasSelectedAnswer}
            className={cn(
              "w-full py-3 rounded-xl font-medium transition-colors",
              hasSelectedAnswer 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            {isLastInDifficulty && (difficulty as string) !== 'hard' ? (
              <>Next: {difficulty === 'easy' ? 'Medium' : 'Hard'} Level <ChevronRight className="w-4 h-4" /></>
            ) : isLastDifficulty ? (
              <>Complete Quiz <Trophy className="w-4 h-4" /></>
            ) : (
              <>Next Question <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}