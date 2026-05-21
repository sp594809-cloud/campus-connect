import { useState } from 'react';
import { Target, TrendingUp, Zap, BookOpen, ArrowRight, Award, Flame, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SubjectProgress = {
  id: string;
  name: string;
  totalTopics: number;
  completedTopics: number;
  averageScore: number;
};

export type Recommendation = {
  topicId: string;
  topicName: string;
  subjectName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reason: string;
};

interface LearningDashboardProps {
  subjects: SubjectProgress[];
  recommendations: Recommendation[];
  onContinue: (subjectId: string, topicId: string) => void;
  streak?: number;
  totalHours?: number;
}

export function LearningDashboard({
  subjects,
  recommendations,
  onContinue,
  streak = 0,
  totalHours = 0,
}: LearningDashboardProps) {
  const overallProgress = subjects.length > 0
    ? Math.round(
        subjects.reduce((acc, s) => acc + (s.completedTopics / s.totalTopics) * 100, 0) / subjects.length
      )
    : 0;

  const strengths = subjects
    .filter(s => s.averageScore >= 70)
    .slice(0, 3)
    .map(s => s.name);

  const weakAreas = subjects
    .filter(s => s.averageScore < 50)
    .slice(0, 3)
    .map(s => s.name);

  const nextRec = recommendations[0];

  return (
    <div className="p-4 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 text-center border">
          <div className="text-2xl font-bold text-primary">{overallProgress}%</div>
          <div className="text-xs text-muted-foreground">Progress</div>
        </div>
        <div className="bg-card rounded-xl p-4 text-center border">
          <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
            <Flame className="w-5 h-5" />{streak}
          </div>
          <div className="text-xs text-muted-foreground">Day Streak</div>
        </div>
        <div className="bg-card rounded-xl p-4 text-center border">
          <div className="text-2xl font-bold text-green-500">{totalHours}h</div>
          <div className="text-xs text-muted-foreground">Total Time</div>
        </div>
      </div>

      {/* Main CTA - Continue Learning */}
      {nextRec && (
        <button
          onClick={() => onContinue(nextRec.subjectName.toLowerCase().replace(' ', '-'), nextRec.topicId)}
          className="w-full p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-between"
        >
          <div className="text-left">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Zap className="w-4 h-4" /> Continue Learning
            </div>
            <div className="font-medium mt-1">{nextRec.topicName}</div>
            <div className="text-xs opacity-80">
              {nextRec.subjectName} · {nextRec.difficulty} · {nextRec.reason}
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </button>
      )}

      {/* Subjects Progress */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Your Subjects
        </h3>
        <div className="space-y-2">
          {subjects.map(subject => {
            const progress = subject.totalTopics > 0 
              ? Math.round((subject.completedTopics / subject.totalTopics) * 100) 
              : 0;
            const isComplete = progress === 100;
            
            return (
              <div key={subject.id} className="p-3 rounded-xl border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{subject.name}</span>
                  <span className={cn(
                    "text-sm",
                    isComplete ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {progress}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      isComplete ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {subject.completedTopics}/{subject.totalTopics} topics · Avg: {subject.averageScore}%
                </div>
              </div>
            );
          })}
          
          {subjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No progress yet. Start learning!</p>
            </div>
          )}
        </div>
      </div>

      {/* Strengths & Weak Areas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
          <h4 className="text-sm font-medium text-green-500 flex items-center gap-1 mb-2">
            <TrendingUp className="w-4 h-4" /> Strengths
          </h4>
          <ul className="text-sm space-y-1">
            {strengths.length > 0 ? strengths.map((s, i) => (
              <li key={i}>• {s}</li>
            )) : <li className="text-muted-foreground">None yet</li>}
          </ul>
        </div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <h4 className="text-sm font-medium text-red-500 flex items-center gap-1 mb-2">
            <Target className="w-4 h-4" /> Needs Work
          </h4>
          <ul className="text-sm space-y-1">
            {weakAreas.length > 0 ? weakAreas.map((s, i) => (
              <li key={i}>• {s}</li>
            )) : <li className="text-muted-foreground">None yet</li>}
          </ul>
        </div>
      </div>

      {/* Recommendations List */}
      {recommendations.length > 1 && (
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" /> Up Next
          </h3>
          <div className="space-y-2">
            {recommendations.slice(1).map((rec, i) => (
              <button
                key={i}
                onClick={() => onContinue(rec.subjectName.toLowerCase().replace(' ', '-'), rec.topicId)}
                className="w-full p-3 rounded-xl border bg-card hover:bg-accent/50 flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="font-medium">{rec.topicName}</div>
                  <div className="text-xs text-muted-foreground">
                    {rec.subjectName} · {rec.difficulty}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}