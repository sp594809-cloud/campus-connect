import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, Award, ArrowRight, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TopicScore = {
  topicId: string;
  topicName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  timeSpent: number; // minutes
  attemptedAt: string;
};

export type SubjectScore = {
  id: string;
  name: string;
  topics: TopicScore[];
};

interface ProgressReportProps {
  subjects: SubjectScore[];
  onRecalculate: () => void;
  onContinue: (subjectId: string, topicId: string) => void;
}

export function ProgressReport({ subjects, onRecalculate, onContinue }: ProgressReportProps) {
  const stats = useMemo(() => {
    let totalScore = 0;
    let totalTime = 0;
    let totalTopics = 0;
    const scoresByDifficulty = { easy: [] as number[], medium: [] as number[], hard: [] as number[] };
    const strongTopics: TopicScore[] = [];
    const weakTopics: TopicScore[] = [];

    subjects.forEach(sub => {
      sub.topics.forEach(t => {
        totalScore += t.score;
        totalTime += t.timeSpent;
        totalTopics++;
        scoresByDifficulty[t.difficulty].push(t.score);
        
        if (t.score >= 80) strongTopics.push(t);
        else if (t.score < 50) weakTopics.push(t);
      });
    });

    const avgScore = totalTopics > 0 ? Math.round(totalScore / totalTopics) : 0;
    const avgEasy = scoresByDifficulty.easy.length > 0 
      ? Math.round(scoresByDifficulty.easy.reduce((a, b) => a + b, 0) / scoresByDifficulty.easy.length) 
      : 0;
    const avgMedium = scoresByDifficulty.medium.length > 0 
      ? Math.round(scoresByDifficulty.medium.reduce((a, b) => a + b, 0) / scoresByDifficulty.medium.length) 
      : 0;
    const avgHard = scoresByDifficulty.hard.length > 0 
      ? Math.round(scoresByDifficulty.hard.reduce((a, b) => a + b, 0) / scoresByDifficulty.hard.length) 
      : 0;

    return {
      avgScore,
      avgEasy,
      avgMedium,
      avgHard,
      totalTime,
      totalTopics: subjects.reduce((acc, s) => acc + s.topics.length, 0),
      strongTopics: strongTopics.sort((a, b) => b.score - a.score).slice(0, 5),
      weakTopics: weakTopics.sort((a, b) => a.score - b.score).slice(0, 5),
    };
  }, [subjects]);

  const suggestedNext = stats.weakTopics[0];

  return (
    <div className="p-4 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "rounded-xl p-4 text-center border",
          stats.avgScore >= 70 ? "bg-green-500/10 border-green-500/30" :
          stats.avgScore >= 50 ? "bg-yellow-500/10 border-yellow-500/30" :
          "bg-red-500/10 border-red-500/30"
        )}>
          <div className="text-3xl font-bold">
            {stats.avgScore}%
          </div>
          <div className="text-sm text-muted-foreground">Average Score</div>
        </div>
        <div className="bg-card rounded-xl p-4 text-center border">
          <div className="text-3xl font-bold text-blue-500">{stats.totalTime}m</div>
          <div className="text-sm text-muted-foreground">Time Spent</div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="p-4 rounded-xl border bg-card">
        <h3 className="font-medium mb-3">Score by Difficulty</h3>
        <div className="space-y-3">
          {[
            { label: 'Easy', score: stats.avgEasy, color: 'bg-green-500' },
            { label: 'Medium', score: stats.avgMedium, color: 'bg-yellow-500' },
            { label: 'Hard', score: stats.avgHard, color: 'bg-red-500' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span className="font-medium">{item.score}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", item.color)}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strong Areas */}
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
        <h3 className="font-medium text-green-600 flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" /> Strong Areas
        </h3>
        <div className="space-y-2">
          {stats.strongTopics.length > 0 ? stats.strongTopics.map((t, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span>{t.topicName}</span>
              <span className="font-medium text-green-500">{t.score}%</span>
            </div>
          )) : (
            <div className="text-sm text-muted-foreground">Keep practicing to see strengths!</div>
          )}
        </div>
      </div>

      {/* Weak Areas */}
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
        <h3 className="font-medium text-red-600 flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4" /> Areas to Improve
        </h3>
        <div className="space-y-2">
          {stats.weakTopics.length > 0 ? stats.weakTopics.map((t, i) => (
            <button
              key={i}
              onClick={() => t.topicName && onContinue(t.topicId, t.topicId)}
              className="w-full flex justify-between items-center text-sm hover:bg-red-500/10 -mx-2 px-2 py-1 rounded"
            >
              <span>{t.topicName}</span>
              <span className="font-medium text-red-500">{t.score}%</span>
            </button>
          )) : (
            <div className="text-sm text-muted-foreground">Great job! No weak areas yet.</div>
          )}
        </div>
      </div>

      {/* Suggested Next */}
      {suggestedNext && (
        <button
          onClick={() => onContinue(suggestedNext.topicId, suggestedNext.topicId)}
          className="w-full p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-between"
        >
          <div className="text-left">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Target className="w-4 h-4" /> Suggested Next
            </div>
            <div className="font-medium">{suggestedNext.topicName}</div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 p-3 rounded-xl border bg-card flex items-center justify-center gap-2 hover:bg-accent">
          <Download className="w-4 h-4" /> Export
        </button>
        <button className="flex-1 p-3 rounded-xl border bg-card flex items-center justify-center gap-2 hover:bg-accent">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </div>
  );
}