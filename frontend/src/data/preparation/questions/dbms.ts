import type { Question } from '@/components/preparation/ProgressiveQuiz';

export const dbmsKeysEasy: Question[] = [
  {
    id: 'dbms-pk-e1',
    text: 'What is a Primary Key in a relational database?',
    options: [
      { id: 'a', text: 'A unique identifier for each row' },
      { id: 'b', text: 'A field that can have multiple values' },
      { id: 'c', text: 'An optional column' },
      { id: 'd', text: 'A reference to another table' },
    ],
    correctOptionId: 'a',
    explanation: 'A primary key uniquely identifies each row and cannot be NULL.',
    difficulty: 'easy',
  },
  {
    id: 'dbms-pk-e2',
    text: 'Which of the following is TRUE about a Primary Key?',
    options: [
      { id: 'a', text: 'It can be NULL' },
      { id: 'b', text: 'A table can have multiple primary keys' },
      { id: 'c', text: 'It uniquely identifies a row' },
      { id: 'd', text: 'It is the same as a Foreign Key' },
    ],
    correctOptionId: 'c',
    explanation: 'A table has at most one primary key, and it cannot be NULL.',
    difficulty: 'easy',
  },
  {
    id: 'dbms-pk-e3',
    text: 'A Foreign Key in Table A typically references which key in Table B?',
    options: [
      { id: 'a', text: 'Primary Key' },
      { id: 'b', text: 'Index' },
      { id: 'c', text: 'View' },
      { id: 'd', text: 'Trigger' },
    ],
    correctOptionId: 'a',
    explanation: 'Foreign keys reference the primary key of another table to enforce referential integrity.',
    difficulty: 'easy',
  },
];

export const dbmsKeysMedium: Question[] = [
  {
    id: 'dbms-pk-m1',
    text: 'A composite primary key is:',
    options: [
      { id: 'a', text: 'A primary key made up of one column' },
      { id: 'b', text: 'A primary key made up of two or more columns' },
      { id: 'c', text: 'A copy of a foreign key' },
      { id: 'd', text: 'An index on multiple tables' },
    ],
    correctOptionId: 'b',
    explanation: 'A composite primary key spans multiple columns whose combination is unique.',
    difficulty: 'medium',
  },
];
