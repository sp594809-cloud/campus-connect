import { useMemo } from 'react';
import type { SubjectProgress, Recommendation } from '../components/preparation/LearningDashboard';

export type TopicProgress = {
  id: string;
  name: string;
  subjectId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'not-started' | 'in-progress' | 'completed';
  score?: number;
  lastAttempted?: string;
};

interface UseNextRecommendationParams {
  subjects: SubjectProgress[];
  topics: TopicProgress[];
}

export function useNextRecommendation({ subjects, topics }: UseNextRecommendationParams): Recommendation[] {
  return useMemo(() => {
    const recommendations: Recommendation[] = [];
    
    // Get subject names map
    const subjectNames: Record<string, string> = {};
    subjects.forEach(s => { subjectNames[s.id] = s.name; });
    
    // Find topics not started
    const notStarted = topics.filter(t => t.status === 'not-started').sort((a, b) => {
      // Prefer easy first
      const diffOrder = { easy: 0, medium: 1, hard: 2 };
      return diffOrder[a.difficulty] - diffOrder[b.difficulty];
    });
    
    // Find in-progress topics
    const inProgress = topics.filter(t => t.status === 'in-progress');
    
    // Priority 1: Continue in-progress
    inProgress.forEach(topic => {
      recommendations.push({
        topicId: topic.id,
        topicName: topic.name,
        subjectName: subjectNames[topic.subjectId] || 'General',
        difficulty: topic.difficulty,
        reason: topic.status === 'in-progress' ? 'Continue where you left off' : 'Resume learning',
      });
    });
    
    // Priority 2: Start easiest not-started
    notStarted.slice(0, 5).forEach(topic => {
      const subject = subjects.find(s => s.id === topic.subjectId);
      const ready = subject && (subject.completedTopics / subject.totalTopics) >= 0.5;
      
      recommendations.push({
        topicId: topic.id,
        topicName: topic.name,
        subjectName: subjectNames[topic.subjectId] || 'General',
        difficulty: topic.difficulty,
        reason: ready ? 'Ready for this topic' : 'Complete more beginner topics first',
      });
    });
    
    // Filter recommendations at threshold
    return recommendations.slice(0, 5);
    
  }, [subjects, topics]);
}

// Get recommendations for a specific subject
export function getSubjectRecommendations(
  subjectId: string,
  topics: TopicProgress[]
): TopicProgress[] {
  const subjectTopics = topics.filter(t => t.subjectId === subjectId).sort((a, b) => {
    if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
    if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
    
    const diffOrder = { easy: 0, medium: 1, hard: 2 };
    return diffOrder[a.difficulty] - diffOrder[b.difficulty];
  });
  
  return subjectTopics;
}