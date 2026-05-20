import { useMemo } from 'react';
import {
  type AssessmentState,
  type ProficiencyBand,
  type GapReport,
  type StudentYear,
  type TargetRole,
  type TopicSelfAssessment,
  type DiagnosticResult,
  type IntakeFormData,
  type LearningPathItem,
  CoreTopic,
  ProficiencyLevel,
  YEAR_TOPIC_RELEVANCE,
  TOPIC_CATEGORIES,
} from '@/core/assessmentTypes';

// Constants
const SELF_ASSESSMENT_WEIGHT = 0.3;
const DIAGNOSTIC_WEIGHT = 0.7;
const MIN_READINESS_THRESHOLD = 50;

interface UseGapAnalysisProps {
  intake: IntakeFormData | null;
  selfAssessments: TopicSelfAssessment[];
  diagnostics: DiagnosticResult[];
}

/**
 * Gap Analysis Hook
 * Combines self-assessment and diagnostic results to generate proficiency bands
 */
export function useGapAnalysis({ intake, selfAssessments, diagnostics }: UseGapAnalysisProps) {
  const proficiencyBands = useMemo((): ProficiencyBand[] => {
    if (!intake) return [];

    const relevantTopics = YEAR_TOPIC_RELEVANCE[intake.currentYear];
    
    return relevantTopics.map(topicId => {
      // Get self-assessment score (convert 1-5 to 0-100)
      const selfAssessment = selfAssessments.find(sa => sa.topicId === topicId);
      const selfScore = selfAssessment 
        ? ((selfAssessment.selfRating - 1) / 4) * 100 
        : 50; // Default to middle if not assessed

      // Get diagnostic score
      const diagnostic = diagnostics.find(d => d.topicId === topicId);
      const diagnosticScore = diagnostic?.score || 0;

      // Calculate weighted overall score
      const overallScore = Math.round(
        selfScore * SELF_ASSESSMENT_WEIGHT +
        diagnosticScore * DIAGNOSTIC_WEIGHT
      );

      // Determine proficiency level
      let level: ProficiencyLevel;
      if (overallScore >= 80) level = ProficiencyLevel.EXPERT;
      else if (overallScore >= 50) level = ProficiencyLevel.PROFICIENT;
      else level = ProficiencyLevel.DEVELOPING;

      // Identify gaps
      const gaps: string[] = [];
      if (overallScore < 50) gaps.push('Needs fundamental understanding');
      if (diagnosticScore < 40 && diagnostic) gaps.push('Low diagnostic performance');
      if (selfScore < 40) gaps.push('Underconfidence in self-rating');

      // Calculate confidence level
      const confidence = overallScore;

      return {
        topicId,
        overallScore,
        selfAssessmentWeight: Math.round(selfScore),
        diagnosticWeight: Math.round(diagnosticScore),
        level,
        confidence,
        gaps,
        lastAssessed: new Date().toISOString(),
      };
    });
  }, [intake, selfAssessments, diagnostics]);

  const gapReport = useMemo((): GapReport | null => {
    if (!intake) return null;

    const learningPath = generateLearningPath(proficiencyBands, intake);

    // Calculate overall readiness
    const proficientTopics = proficiencyBands.filter(
      b => b.level !== ProficiencyLevel.DEVELOPING
    ).length;
    const totalTopics = proficiencyBands.length;
    const overallReadinessScore = Math.round((proficientTopics / totalTopics) * 100);

    // Determine if ready for interview prep
    const isReadyForInterviewPrep = overallReadinessScore >= MIN_READINESS_THRESHOLD;

    return {
      studentId: intake.studentId,
      studentYear: intake.currentYear,
      targetRoles: intake.targetRoles,
      proficiencyBands,
      learningPath,
      overallReadinessScore,
      isReadyForInterviewPrep,
      generatedAt: new Date().toISOString(),
    };
  }, [intake, proficiencyBands]);

  return {
    proficiencyBands,
    gapReport,
  };
}

/**
 * Generate Learning Path from Proficiency Bands
 */
function generateLearningPath(
  proficiencyBands: ProficiencyBand[],
  intake: IntakeFormData
): LearningPathItem[] {
  const relevantTopics = YEAR_TOPIC_RELEVANCE[intake.currentYear];

  // Sort by: gaps first, then by priority defined for student year
  const sortedBands = [...proficiencyBands].sort((a, b) => {
    // Developing topics first
    if (a.level !== b.level) {
      if (a.level === ProficiencyLevel.DEVELOPING) return -1;
      if (b.level === ProficiencyLevel.DEVELOPING) return 1;
    }
    // Then by confidence score (lower = higher priority)
    return a.confidence - b.confidence;
  });

  return sortedBands.map((band, idx) => {
    const topicCategory = TOPIC_CATEGORIES[band.topicId];
    const estimatedHours = estimateLearningTime(band);

    return {
      topicId: band.topicId,
      priority: idx + 1,
      estimatedHours,
      currentLevel: band.level,
      targetLevel: ProficiencyLevel.PROFICIENT,
      resources: getDefaultResources(band.topicId),
      status: band.level === ProficiencyLevel.DEVELOPING 
        ? 'pending' 
        : band.level === ProficiencyLevel.PROFICIENT 
          ? 'in_progress' 
          : 'completed',
    };
  });
}

/**
 * Estimate learning time based on proficiency gap
 */
function estimateLearningTime(band: ProficiencyBand): number {
  const gap = 100 - band.confidence;
  
  if (gap >= 70) return 20; // Developing - ~20 hours
  if (gap >= 40) return 10; // Approaching proficient - ~10 hours
  if (gap >= 20) return 5;  // Near proficient - ~5 hours
  return 2; // Expert - maintain
}

/**
 * Get default learning resources
 */
function getDefaultResources(topicId: CoreTopic): string[] {
  const resources: Record<CoreTopic, string[]> = {
    [CoreTopic.DSA]: [
      'LeetCode Practice',
      'GeeksforGeeks DSA',
      'Cracking the Coding Interview',
    ],
    [CoreTopic.DBMS]: [
      'SQL Practice',
      'Database Normalization Tutorial',
      'Transaction Management Guide',
    ],
    [CoreTopic.OS]: [
      'Operating Systems Concepts',
      'Process Scheduling Guide',
      'Memory Management Tutorial',
    ],
    [CoreTopic.CN]: [
      'Computer Networking Basics',
      'TCP/IP Protocol Suite',
      'Network Security Guide',
    ],
    [CoreTopic.APTITUDE]: [
      'Quantitative Aptitude Practice',
      'Logical Reasoning Papers',
      'Previous Year Questions',
    ],
    [CoreTopic.SOFT_SKILLS]: [
      'Behavioral Interview Questions',
      'STAR Method Guide',
      'Leadership Stories',
    ],
    [CoreTopic.SYSTEM_DESIGN]: [
      'System Design Primer',
      'Scalability Fundamentals',
      'Distributed Systems Guide',
    ],
  };
  return resources[topicId];
}

export default useGapAnalysis;