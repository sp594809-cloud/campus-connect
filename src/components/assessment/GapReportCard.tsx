import { useState } from 'react';
import { Trophy, TrendingUp, AlertTriangle, ChevronRight, BookOpen, Target, Award } from 'lucide-react';
import {
  type GapReport,
  type ProficiencyBand,
  type LearningPathItem,
  ProficiencyLevel,
} from '@/core/assessmentTypes';
import { YEAR_TOPIC_RELEVANCE } from '@/core/assessmentTypes';

interface GapReportCardProps {
  gapReport: GapReport;
}

// Color mapping for proficiency levels
const LEVEL_COLORS = {
  [ProficiencyLevel.EXPERT]: { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500' },
  [ProficiencyLevel.PROFICIENT]: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500' },
  [ProficiencyLevel.DEVELOPING]: { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500' },
};

// Progress bar component
function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-500 ${color || 'bg-primary'}`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Single proficiency band display
function ProficiencyCard({ band }: { band: ProficiencyBand }) {
  const colors = LEVEL_COLORS[band.level];
  const icon = band.level === ProficiencyLevel.EXPERT ? '🏆' : band.level === ProficiencyLevel.PROFICIENT ? '✅' : '📚';

  return (
    <div className={`p-3 rounded-lg border-2 ${colors.bg} ${colors.border}/30`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold">{band.topicId}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
          {band.level.toUpperCase()}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Score</span>
          <span className="font-medium">{band.overallScore}%</span>
        </div>
        <ProgressBar value={band.overallScore} color={colors.text.replace('text-', 'bg-')} />
        {band.gaps.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/30">
            {band.gaps.map((gap, idx) => (
              <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-500" />
                {gap}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Learning path item
function LearningPathItemCard({ item, index }: { item: LearningPathItem; index: number }) {
  const statusIcons = {
    pending: '⏳',
    in_progress: '📖',
    completed: '✅',
    mastered: '🏆',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">{item.topicId}</span>
          <span className="text-sm text-muted-foreground">{item.estimatedHours}h</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{statusIcons[item.status]}</span>
          <span>{item.status.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );
}

export function GapReportCard({ gapReport }: GapReportCardProps) {
  const { proficiencyBands, learningPath, overallReadinessScore, isReadyForInterviewPrep, studentYear } = gapReport;

  const relevantTopics = YEAR_TOPIC_RELEVANCE[studentYear];
  const expertCount = proficiencyBands.filter(b => b.level === ProficiencyLevel.EXPERT).length;
  const proficientCount = proficiencyBands.filter(b => b.level === ProficiencyLevel.PROFICIENT).length;
  const developingCount = proficiencyBands.filter(b => b.level === ProficiencyLevel.DEVELOPING).length;

  return (
    <div className="space-y-6">
      {/* Hero Score Card */}
      <div className="relative p-6 bg-gradient-card rounded-xl shadow-elevated overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-cta flex items-center justify-center shadow-glow">
              {isReadyForInterviewPrep ? (
                <Trophy className="w-8 h-8 text-white" />
              ) : (
                <Target className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{overallReadinessScore}%</h2>
              <p className="text-sm text-muted-foreground">Readiness Score</p>
            </div>
          </div>

          {/* Readiness Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            isReadyForInterviewPrep 
              ? 'bg-green-500/20 text-green-500' 
              : 'bg-orange-500/20 text-orange-500'
          }`}>
            {isReadyForInterviewPrep ? (
              <>
                <Award className="w-4 h-4" />
                Ready for Interview Prep!
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Keep Learning to Unlock
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-green-500/10 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-500">{expertCount}</div>
          <div className="text-xs text-muted-foreground">Expert</div>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-500">{proficientCount}</div>
          <div className="text-xs text-muted-foreground">Proficient</div>
        </div>
        <div className="p-3 bg-red-500/10 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-500">{developingCount}</div>
          <div className="text-xs text-muted-foreground">Developing</div>
        </div>
      </div>

      {/* Proficiency Bands */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Topic Proficiency
        </h3>
        <div className="space-y-2">
          {proficiencyBands.sort((a, b) => b.overallScore - a.overallScore).map(band => (
            <ProficiencyCard key={band.topicId} band={band} />
          ))}
        </div>
      </div>

      {/* Learning Path */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 rotate-90" />
          Your Learning Path
        </h3>
        <div className="space-y-2">
          {learningPath.slice(0, 5).map((item, idx) => (
            <LearningPathItemCard key={item.topicId} item={item} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default GapReportCard;