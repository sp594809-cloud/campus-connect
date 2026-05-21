import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, CheckCircle, XCircle, ChevronRight, RotateCcw, Zap } from 'lucide-react';
import {
  CoreTopic,
  type DiagnosticQuestion,
  type QuizAttempt,
  type DiagnosticResult,
  DifficultyTier,
  QuestionType,
} from '@/core/assessmentTypes';

// Sample question bank - in production, this would come from an API
const QUESTION_BANK: DiagnosticQuestion[] = [
  // DSA - Easy
  { id: 'dsa-e-1', topicId: CoreTopic.DSA, difficulty: DifficultyTier.EASY, type: QuestionType.MULTIPLE_CHOICE, question: 'What is the time complexity of accessing an element in an array?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correctAnswer: 0, explanation: 'Arrays provide O(1) random access by index.' },
  { id: 'dsa-e-2', topicId: CoreTopic.DSA, difficulty: DifficultyTier.EASY, type: QuestionType.MULTIPLE_CHOICE, question: 'Which data structure follows LIFO (Last In First Out)?', options: ['Queue', 'Stack', 'Array', 'Tree'], correctAnswer: 1, explanation: 'Stack follows Last In First Out principle.' },
  { id: 'dsa-e-3', topicId: CoreTopic.DSA, difficulty: DifficultyTier.EASY, type: QuestionType.TRUE_FALSE, question: 'A linked list always uses contiguous memory.', options: ['True', 'False'], correctAnswer: 1, explanation: 'Linked list nodes can be scattered in memory.' },
  // DSA - Medium
  { id: 'dsa-m-1', topicId: CoreTopic.DSA, difficulty: DifficultyTier.MEDIUM, type: QuestionType.MULTIPLE_CHOICE, question: 'What is the worst case time complexity of QuickSort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctAnswer: 2, explanation: 'QuickSort degrades to O(n²) when pivot is always min/max.' },
  { id: 'dsa-m-2', topicId: CoreTopic.DSA, difficulty: DifficultyTier.MEDIUM, type: QuestionType.MULTIPLE_CHOICE, question: 'Which traversal visits root first, then children?', options: ['Inorder', 'Preorder', 'Postorder', 'Level order'], correctAnswer: 1, explanation: 'Preorder visits: Root → Left → Right.' },
  // DBMS - Easy
  { id: 'dbms-e-1', topicId: CoreTopic.DBMS, difficulty: DifficultyTier.EASY, type: QuestionType.MULTIPLE_CHOICE, question: 'Which SQL clause is used to filter grouped results?', options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], correctAnswer: 1, explanation: 'HAVING filters groups after GROUP BY aggregation.' },
  { id: 'dbms-e-2', topicId: CoreTopic.DBMS, difficulty: DifficultyTier.EASY, type: QuestionType.MULTIPLE_CHOICE, question: 'What does ACID stand for in databases?', options: ['Atomic, Consistent, Isolated, Durable', 'Advanced, Concurrent, Integrated, Distributed', 'Array, Control, Index, Data', 'None of these'], correctAnswer: 0, explanation: 'ACID ensures reliable database transactions.' },
  // DBMS - Medium
  { id: 'dbms-m-1', topicId: CoreTopic.DBMS, difficulty: DifficultyTier.MEDIUM, type: QuestionType.MULTIPLE_CHOICE, question: 'Which normal form eliminates transitive dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctAnswer: 2, explanation: '3NF eliminates transitive dependencies.' },
  // OS - Easy
  { id: 'os-e-1', topicId: CoreTopic.OS, difficulty: DifficultyTier.EASY, type: QuestionType.MULTIPLE_CHOICE, question: 'What is a deadlock?', options: ['Process termination', 'Circular wait for resources', 'Memory overflow', 'CPU overload'], correctAnswer: 1, explanation: 'Deadlock occurs when processes wait circularly for resources.' },
  { id: 'os-e-2', topicId: CoreTopic.OS, difficulty: DifficultyTier.EASY, type: QuestionType.TRUE_FALSE, question: 'Multitasking allows multiple processes to run simultaneously on one CPU.', options: ['True', 'False'], correctAnswer: 0, explanation: 'OS quickly switches between processes (time-sharing).' },
  // OS - Medium
  { id: 'os-m-1', topicId: CoreTopic.OS, difficulty: DifficultyTier.MEDIUM, type: QuestionType.MULTIPLE_CHOICE, question: 'Which scheduling algorithm minimizes average wait time?', options: ['FCFS', 'SJF', 'Round Robin', 'Priority'], correctAnswer: 1, explanation: 'SJF (Shortest Job First) minimizes average waiting.' },
  // CN - Easy
  { id: 'cn-e-1', topicId: CoreTopic.CN, difficulty: DifficultyTier.EASY, type: QuestionType.MULTIPLE_CHOICE, question: 'Which layer handles routing?', options: ['Transport', 'Network', 'Data Link', 'Application'], correctAnswer: 1, explanation: 'Network layer handles routing ( Layer 3).' },
  { id: 'cn-e-2', topicId: CoreTopic.CN, difficulty: DifficultyTier.EASY, type: QuestionType.MULTIPLE_CHOICE, question: 'HTTP uses which port by default?', options: ['21', '22', '80', '443'], correctAnswer: 2, explanation: 'HTTP defaults to port 80.' },
  // CN - Medium
  { id: 'cn-m-1', topicId: CoreTopic.CN, difficulty: DifficultyTier.MEDIUM, type: QuestionType.MULTIPLE_CHOICE, question: 'What protocol guarantees delivery?', options: ['UDP', 'TCP', 'HTTP', 'DNS'], correctAnswer: 1, explanation: 'TCP provides reliable, ordered delivery.' },
  // Aptitude
  { id: 'apt-e-1', topicId: CoreTopic.APTITUDE, difficulty: DifficultyTier.EASY, type: QuestionType.MULTIPLE_CHOICE, question: 'If 3 cats catch 3 rats in 3 days, how many cats needed for 100 rats in 100 days?', options: ['3', '100', '1', '33'], correctAnswer: 0, explanation: '3 cats catch 1 rat/day, so always 3 cats needed.' },
];

interface DiagnosticQuizProps {
  topics: CoreTopic[];
  questionCount?: number;
  onComplete: (results: DiagnosticResult[]) => void;
  timeLimit?: number;
}

export function DiagnosticQuiz({
  topics,
  questionCount = 5,
  onComplete,
  timeLimit = 300, // 5 minutes default
}: DiagnosticQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isComplete, setIsComplete] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyTier>(DifficultyTier.EASY);
  const [streak, setStreak] = useState(0);

  // Get questions for selected topics
  const questions = QUESTION_BANK.filter(q => topics.includes(q.topicId))
    .sort(() => Math.random() - 0.5)
    .slice(0, questionCount);

  // Timer - ONLY triggers quiz end when time truly runs out, NOT auto-submit
  // We use refs to avoid stale closure issues
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef({ currentIndex, selectedAnswer, showResult, isComplete, timeRemaining, questions: questions.length });
  
  // Keep ref updated
  useEffect(() => {
    stateRef.current = { currentIndex, selectedAnswer, showResult, isComplete, timeRemaining, questions: questions.length };
  }, [currentIndex, selectedAnswer, showResult, isComplete, timeRemaining, questions.length]);

  useEffect(() => {
    if (isComplete || timeRemaining <= 0 || showResult) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      const state = stateRef.current;
      
      if (state.timeRemaining <= 1) {
        // Time's up
        if (timerRef.current) clearInterval(timerRef.current);
        
        if (state.selectedAnswer !== null) {
          // Auto-submit current answer if selected
          const currentQ = questions[state.currentIndex];
          const attempt: QuizAttempt = {
            questionId: currentQ.id,
            selectedAnswer: state.selectedAnswer,
            isCorrect: state.selectedAnswer === currentQ.correctAnswer,
            timeTaken: timeLimit,
          };
          setAttempts(prev => [...prev, attempt]);
          
          // Move to next or finish
          if (state.currentIndex < state.questions - 1) {
            setCurrentIndex(state.currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
          } else {
            handleFinish();
          }
        } else {
          handleFinish();
        }
        setTimeRemaining(0);
      } else {
        setTimeRemaining(state.timeRemaining - 1);
      }
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // Empty deps - we use ref instead

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const attempt: QuizAttempt = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect: selectedAnswer === currentQuestion.correctAnswer,
      timeTaken: timeLimit - timeRemaining,
    };

    setAttempts(prev => [...prev, attempt]);
    setShowResult(true);

    // Adaptive difficulty adjustment
    if (attempt.isCorrect) {
      setStreak(prev => prev + 1);
      if (streak >= 2 && difficulty !== DifficultyTier.HARD) {
        setDifficulty(DifficultyTier.MEDIUM);
      }
    } else {
      setStreak(0);
      if (difficulty !== DifficultyTier.EASY) {
        setDifficulty(DifficultyTier.EASY);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setIsComplete(true);
    
    // Group results by topic
    const resultsByTopic = topics.map(topicId => {
      const topicAttempts = attempts.filter(a => {
        const q = questions.find(q => q.id === a.questionId);
        return q?.topicId === topicId;
      });
      
      const correct = topicAttempts.filter(a => a.isCorrect).length;
      
      return {
        topicId,
        score: topicAttempts.length > 0 ? (correct / topicAttempts.length) * 100 : 0,
        totalQuestions: topicAttempts.length,
        correctAnswers: correct,
        averageTimePerQuestion: topicAttempts.length > 0 
          ? topicAttempts.reduce((acc, a) => acc + a.timeTaken, 0) / topicAttempts.length 
          : 0,
        difficultyAttempted: difficulty,
        attempts: topicAttempts,
        completedAt: new Date().toISOString(),
      };
    });

    onComplete(resultsByTopic);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAttempts([]);
    setShowResult(false);
    setTimeRemaining(timeLimit);
    setIsComplete(false);
    setStreak(0);
    setDifficulty(DifficultyTier.EASY);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No questions available for selected topics.</p>
      </div>
    );
  }

  if (isComplete) {
    const correctCount = attempts.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / attempts.length) * 100);

    return (
      <div className="space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-card flex items-center justify-center mx-auto shadow-soft">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <p className="text-muted-foreground">You've answered all questions</p>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-card rounded-lg shadow-soft">
          <div>
            <div className="text-2xl font-bold text-green-500">{correctCount}</div>
            <div className="text-xs text-muted-foreground">Correct</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{attempts.length - correctCount}</div>
            <div className="text-xs text-muted-foreground">Wrong</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{percentage}%</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>

        <button
          onClick={restartQuiz}
          className="w-full py-3 border border-border rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-card rounded-lg shadow-soft">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className={`text-sm font-mono ${timeRemaining < 60 ? 'text-red-500' : ''}`}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {currentIndex + 1} / {questions.length}
          </span>
          {streak >= 2 && (
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
              🔥 {streak} streak
            </span>
          )}
        </div>
      </div>

      {/* Question Card */}
      <div className="p-4 bg-card border border-border rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
            {currentQuestion.topicId}
          </span>
          <span className="text-xs px-2 py-1 bg-muted rounded">
            {currentQuestion.difficulty}
          </span>
        </div>

        <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={showResult}
              className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                showResult
                  ? idx === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-500/10'
                    : idx === selectedAnswer
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-border'
                  : selectedAnswer === idx
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {showResult ? (
                  idx === currentQuestion.correctAnswer ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : idx === selectedAnswer ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-border" />
                  )
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    selectedAnswer === idx ? 'border-primary bg-primary' : 'border-border'
                  }`} />
                )}
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Explanation (shown after answering) */}
        {showResult && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className="w-full py-3 bg-gradient-cta text-white rounded-lg font-medium disabled:opacity-50"
        >
          Submit Answer
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full py-3 bg-gradient-cta text-white rounded-lg font-medium flex items-center justify-center gap-2"
        >
          {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default DiagnosticQuiz;