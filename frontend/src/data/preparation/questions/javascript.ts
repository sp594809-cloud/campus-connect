import type { Question } from '@/components/preparation/ProgressiveQuiz';

export const jsFunctionsEasy: Question[] = [
  {
    id: 'js-fn-e1',
    text: 'Write a function `add(a, b)` that returns the sum of two numbers.',
    options: [
      { id: 'a', text: 'function add(a, b) { return a + b; }' },
      { id: 'b', text: 'function add(a, b) { a + b; }' },
      { id: 'c', text: 'function add() { return a + b; }' },
      { id: 'd', text: 'add(a, b) => a + b' },
    ],
    correctOptionId: 'a',
    explanation: 'Functions in JavaScript must explicitly `return` a value when you want a result.',
    difficulty: 'easy',
  },
  {
    id: 'js-fn-e2',
    text: 'Which is the correct syntax for an arrow function that doubles its input?',
    options: [
      { id: 'a', text: 'const dbl = (n) => { n * 2 }' },
      { id: 'b', text: 'const dbl = (n) => n * 2' },
      { id: 'c', text: 'const dbl = n -> n * 2' },
      { id: 'd', text: 'function dbl => n * 2' },
    ],
    correctOptionId: 'b',
    explanation: 'Arrow functions with a single expression return implicitly when there are no braces.',
    difficulty: 'easy',
  },
  {
    id: 'js-fn-e3',
    text: 'What does `function greet(name="friend") { return "Hi " + name; }` return when called as `greet()`?',
    options: [
      { id: 'a', text: 'Hi undefined' },
      { id: 'b', text: 'Error' },
      { id: 'c', text: 'Hi friend' },
      { id: 'd', text: 'Hi null' },
    ],
    correctOptionId: 'c',
    explanation: 'Default parameters are used when no argument is passed.',
    difficulty: 'easy',
  },
];

export const jsFunctionsMedium: Question[] = [
  {
    id: 'js-fn-m1',
    text: 'What will `(function() { return this; })()` return in strict mode?',
    options: [
      { id: 'a', text: 'window / globalThis' },
      { id: 'b', text: 'undefined' },
      { id: 'c', text: 'null' },
      { id: 'd', text: 'Error' },
    ],
    correctOptionId: 'b',
    explanation: 'In strict mode, `this` inside a regular function call is `undefined`.',
    difficulty: 'medium',
  },
  {
    id: 'js-fn-m2',
    text: 'Which method creates a new function with bound `this`?',
    options: [
      { id: 'a', text: 'call()' },
      { id: 'b', text: 'apply()' },
      { id: 'c', text: 'bind()' },
      { id: 'd', text: 'new()' },
    ],
    correctOptionId: 'c',
    explanation: '`bind()` returns a new function permanently bound to a specific `this`.',
    difficulty: 'medium',
  },
];
