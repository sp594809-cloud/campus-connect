import { supabase } from '@/integrations/supabase/client';

export type ProgressRecord = {
  id?: string;
  user_id: string;
  topic_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  time_spent: number;
  completed_at: string;
};

export async function saveProgress(record: Omit<ProgressRecord, 'id'>): Promise<{ data: ProgressRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('preparation_progress')
    .upsert({
      user_id: record.user_id,
      topic_id: record.topic_id,
      difficulty: record.difficulty,
      score: record.score,
      time_spent: record.time_spent,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,topic_id,difficulty',
    })
    .select()
    .single();

  return { data: data as ProgressRecord | null, error };
}

export async function getUserProgress(userId: string): Promise<ProgressRecord[]> {
  const { data, error } = await supabase
    .from('preparation_progress')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch progress:', error);
    return [];
  }

  return (data || []) as ProgressRecord[];
}

export async function getTopicProgress(
  userId: string, 
  topicId: string
): Promise<Record<'easy' | 'medium' | 'hard', number>> {
  const records = await getUserProgress(userId);
  const topicRecords = records.filter(r => r.topic_id === topicId);
  
  const scores = { easy: 0, medium: 0, hard: 0 };
  topicRecords.forEach(r => {
    if (scores[r.difficulty] !== undefined) {
      scores[r.difficulty] = r.score;
    }
  });
  
  return scores;
}

export async function getSubjectSummary(
  userId: string,
  subjectId: string
): Promise<{
  completedTopics: number;
  totalTopics: number;
  averageScore: number;
}> {
  const records = await getUserProgress(userId);
  
  const topicScores = new Map<string, number[]>();
  records.forEach(r => {
    const existing = topicScores.get(r.topic_id) || [];
    existing.push(r.score);
    topicScores.set(r.topic_id, existing);
  });
  
  let totalScore = 0;
  let totalTopics = 0;
  topicScores.forEach(scores => {
    totalScore += scores[scores.length - 1]; // latest score
    totalTopics++;
  });
  
  return {
    completedTopics: totalTopics,
    totalTopics: 10, // placeholder
    averageScore: totalTopics > 0 ? Math.round(totalScore / totalTopics) : 0,
  };
}