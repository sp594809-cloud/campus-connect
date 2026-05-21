import type { Question } from '@/components/preparation/ProgressiveQuiz';

export const pyLoopsEasy: Question[] = [
  {
    id: 'py-loop-e1',
    text: 'Write a Python loop that prints numbers 1 through 5.',
    options: [
      { id: 'a', text: 'for i in range(1, 5): print(i)' },
      { id: 'b', text: 'for i in range(1, 6): print(i)' },
      { id: 'c', text: 'for i in 1..5: print(i)' },
      { id: 'd', text: 'while i < 5: print(i)' },
    ],
    correctOptionId: 'b',
    explanation: '`range(1, 6)` is exclusive of the end, so it yields 1,2,3,4,5.',
    difficulty: 'easy',
  },
  {
    id: 'py-loop-e2',
    text: 'How do you iterate over both index AND value of a list `nums`?',
    options: [
      { id: 'a', text: 'for i, v in nums:' },
      { id: 'b', text: 'for v in nums.items():' },
      { id: 'c', text: 'for i, v in enumerate(nums):' },
      { id: 'd', text: 'for v in nums.index():' },
    ],
    correctOptionId: 'c',
    explanation: '`enumerate()` returns (index, value) tuples while iterating.',
    difficulty: 'easy',
  },
  {
    id: 'py-loop-e3',
    text: 'Which list comprehension squares every element of `nums`?',
    options: [
      { id: 'a', text: '[x*x for x in nums]' },
      { id: 'b', text: '(x*x for x in nums)' },
      { id: 'c', text: '{x*x for x in nums}' },
      { id: 'd', text: 'map(x*x, nums)' },
    ],
    correctOptionId: 'a',
    explanation: 'Square brackets create a list comprehension; round brackets create a generator.',
    difficulty: 'easy',
  },
];

export const pyLoopsMedium: Question[] = [
  {
    id: 'py-loop-m1',
    text: 'What is the output of: `print(sum(i for i in range(5) if i % 2 == 0))`?',
    options: [
      { id: 'a', text: '4' },
      { id: 'b', text: '6' },
      { id: 'c', text: '10' },
      { id: 'd', text: '0+2+4 = 6' },
    ],
    correctOptionId: 'b',
    explanation: '0 + 2 + 4 = 6. The generator filters evens then sums.',
    difficulty: 'medium',
  },
];
