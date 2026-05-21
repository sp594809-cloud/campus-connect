import type { Question } from '@/components/preparation/ProgressiveQuiz';

export const osSchedulingEasy: Question[] = [
  {
    id: 'os-sched-e1',
    text: 'Which scheduling algorithm assigns CPU to the process with the shortest expected CPU burst?',
    options: [
      { id: 'a', text: 'First Come First Serve (FCFS)' },
      { id: 'b', text: 'Round Robin' },
      { id: 'c', text: 'Shortest Job First (SJF)' },
      { id: 'd', text: 'Priority Scheduling' },
    ],
    correctOptionId: 'c',
    explanation: 'SJF picks the process with the smallest next CPU burst, minimising average waiting time.',
    difficulty: 'easy',
  },
  {
    id: 'os-sched-e2',
    text: 'Round Robin scheduling primarily relies on which concept?',
    options: [
      { id: 'a', text: 'Process priority' },
      { id: 'b', text: 'Time quantum / time slice' },
      { id: 'c', text: 'Process size' },
      { id: 'd', text: 'Arrival time only' },
    ],
    correctOptionId: 'b',
    explanation: 'Round Robin gives each process a fixed time slice in a circular order.',
    difficulty: 'easy',
  },
  {
    id: 'os-sched-e3',
    text: 'Which scheduling algorithm is non-preemptive?',
    options: [
      { id: 'a', text: 'Round Robin' },
      { id: 'b', text: 'FCFS' },
      { id: 'c', text: 'SRTF (Shortest Remaining Time First)' },
      { id: 'd', text: 'Preemptive Priority' },
    ],
    correctOptionId: 'b',
    explanation: 'FCFS runs each process to completion in arrival order without preemption.',
    difficulty: 'easy',
  },
];

export const osSchedulingMedium: Question[] = [
  {
    id: 'os-sched-m1',
    text: 'In Round Robin, if the time quantum is too large, the scheduler degenerates to:',
    options: [
      { id: 'a', text: 'SJF' },
      { id: 'b', text: 'FCFS' },
      { id: 'c', text: 'SRTF' },
      { id: 'd', text: 'Priority' },
    ],
    correctOptionId: 'b',
    explanation: 'A very large quantum means each process effectively runs to completion — the same behaviour as FCFS.',
    difficulty: 'medium',
  },
];
