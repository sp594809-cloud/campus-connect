import type { Question } from '@/components/preparation/ProgressiveQuiz';

// DSA Arrays Easy Questions
export const dsaArraysEasy: Question[] = [
  {
    id: 'dsa-arr-e1',
    text: 'What is the time complexity of accessing an element in an array by index?',
    options: [
      { id: 'a', text: 'O(1)' },
      { id: 'b', text: 'O(n)' },
      { id: 'c', text: 'O(log n)' },
      { id: 'd', text: 'O(n²)' },
    ],
    correctOptionId: 'a',
    explanation: 'Arrays provide O(1) random access because elements are stored contiguously and can be accessed directly via index.',
    difficulty: 'easy',
  },
  {
    id: 'dsa-arr-e2',
    text: 'Which data structure uses contiguous memory allocation?',
    options: [
      { id: 'a', text: 'Linked List' },
      { id: 'b', text: 'Array' },
      { id: 'c', text: 'Tree' },
      { id: 'd', text: 'Graph' },
    ],
    correctOptionId: 'b',
    explanation: 'Arrays store elements in consecutive memory locations, providing fast random access.',
    difficulty: 'easy',
  },
  {
    id: 'dsa-arr-e3',
    text: 'Which algorithm is best for searching in a sorted array?',
    options: [
      { id: 'a', text: 'Linear Search' },
      { id: 'b', text: 'Binary Search' },
      { id: 'c', text: 'Bubble Sort' },
      { id: 'd', text: 'Selection Sort' },
    ],
    correctOptionId: 'b',
    explanation: 'Binary search divides the search space in half each time, achieving O(log n) time.',
    difficulty: 'easy',
  },
  {
    id: 'dsa-arr-e4',
    text: 'What is the space complexity of creating a copy of an array of size n?',
    options: [
      { id: 'a', text: 'O(1)' },
      { id: 'b', text: 'O(n)' },
      { id: 'c', text: 'O(log n)' },
      { id: 'd', text: 'O(n²)' },
    ],
    correctOptionId: 'b',
    explanation: 'Copying n elements requires O(n) extra space.',
    difficulty: 'easy',
  },
  {
    id: 'dsa-arr-e5',
    text: 'Array elements are identified by their:',
    options: [
      { id: 'a', text: 'Value' },
      { id: 'b', text: 'Index' },
      { id: 'c', text: 'Pointer' },
      { id: 'd', text: 'Address' },
    ],
    correctOptionId: 'b',
    explanation: 'Each array element is accessed using its unique index position.',
    difficulty: 'easy',
  },
];

// DSA Arrays Medium Questions
export const dsaArraysMedium: Question[] = [
  {
    id: 'dsa-arr-m1',
    text: 'What is the time complexity of merging two sorted arrays of sizes n and m?',
    options: [
      { id: 'a', text: 'O(n + m)' },
      { id: 'b', text: 'O(n × m)' },
      { id: 'c', text: 'O(log n)' },
      { id: 'd', text: 'O(n²)' },
    ],
    correctOptionId: 'a',
    explanation: 'We traverse both arrays once, giving O(n+m) time.',
    difficulty: 'medium',
  },
  {
    id: 'dsa-arr-m2',
    text: 'In quicksort, what is the worst-case time complexity?',
    options: [
      { id: 'a', text: 'O(n log n)' },
      { id: 'b', text: 'O(n²)' },
      { id: 'c', text: 'O(n)' },
      { id: 'd', text: 'O(1)' },
    ],
    correctOptionId: 'b',
    explanation: 'When pivot is always smallest/largest, quicksort degrades to O(n²).',
    difficulty: 'medium',
  },
  {
    id: 'dsa-arr-m3',
    text: 'Which sorting algorithm is stable?',
    options: [
      { id: 'a', text: 'Quick Sort' },
      { id: 'b', text: 'Merge Sort' },
      { id: 'c', text: 'Heap Sort' },
      { id: 'd', text: 'Selection Sort' },
    ],
    correctOptionId: 'b',
    explanation: 'Merge sort preserves relative order of equal elements.',
    difficulty: 'medium',
  },
];

// Export combined questions
export const dsaArraysQuestions: Question[] = [
  ...dsaArraysEasy,
  ...dsaArraysMedium,
];

export function getQuestionsByDifficulty(
  topicId: string, 
  difficulty: 'easy' | 'medium' | 'hard'
): Question[] {
  if (topicId === 'dsa-arrays') {
    if (difficulty === 'easy') return dsaArraysEasy;
    if (difficulty === 'medium') return dsaArraysMedium;
  }
  return [];
}

export function getAllQuestionsForTopic(topicId: string): Question[] {
  if (topicId === 'dsa-arrays') {
    return dsaArraysQuestions;
  }
  return [];
}