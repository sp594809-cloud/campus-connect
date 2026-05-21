import type { Question } from '@/components/preparation/ProgressiveQuiz';
import { dsaArraysEasy, dsaArraysMedium } from './dsa';
import { jsFunctionsEasy, jsFunctionsMedium } from './javascript';
import { pyLoopsEasy, pyLoopsMedium } from './python';
import { dbmsKeysEasy, dbmsKeysMedium } from './dbms';
import { osSchedulingEasy, osSchedulingMedium } from './os';

export * from './dsa';
export * from './javascript';
export * from './python';
export * from './dbms';
export * from './os';

// Topic id -> { name, subjectId, easy, medium, hard }
export type TopicBank = {
  id: string;
  name: string;
  subjectId: string;
  easy: Question[];
  medium: Question[];
  hard: Question[];
};

export const TOPIC_BANKS: TopicBank[] = [
  {
    id: 'dsa-arrays', name: 'Arrays', subjectId: 'dsa',
    easy: dsaArraysEasy, medium: dsaArraysMedium, hard: [],
  },
  {
    id: 'js-functions', name: 'Functions', subjectId: 'javascript',
    easy: jsFunctionsEasy, medium: jsFunctionsMedium, hard: [],
  },
  {
    id: 'py-loops', name: 'Loops & Iteration', subjectId: 'python',
    easy: pyLoopsEasy, medium: pyLoopsMedium, hard: [],
  },
  {
    id: 'dbms-keys', name: 'Primary & Foreign Keys', subjectId: 'dbms',
    easy: dbmsKeysEasy, medium: dbmsKeysMedium, hard: [],
  },
  {
    id: 'os-scheduling', name: 'CPU Scheduling', subjectId: 'os',
    easy: osSchedulingEasy, medium: osSchedulingMedium, hard: [],
  },
];

export function getTopicBank(topicId: string): TopicBank | undefined {
  return TOPIC_BANKS.find(t => t.id === topicId);
}

export function getTopicsForSubject(subjectId: string): TopicBank[] {
  return TOPIC_BANKS.filter(t => t.subjectId === subjectId);
}

export function getAllQuestionsForTopic(topicId: string): Question[] {
  const t = getTopicBank(topicId);
  if (!t) return [];
  return [...t.easy, ...t.medium, ...t.hard];
}

export function getQuestionsByDifficulty(
  topicId: string,
  difficulty: 'easy' | 'medium' | 'hard',
): Question[] {
  const t = getTopicBank(topicId);
  if (!t) return [];
  return t[difficulty];
}
