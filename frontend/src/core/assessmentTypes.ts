/**
 * Assessment Types & Competency Framework
 * 
 * Core topics and proficiency levels for student interview readiness system.
 */

// Student Years
export type StudentYear = 1 | 2 | 3 | 4;

// Target Roles
export type TargetRole = 'SDE' | 'Data Science' | 'ML/AI' | 'DevOps' | 'Frontend' | 'Backend' | 'Full Stack';

// Target Company Types
export type CompanyTier = 'FAANG' | 'Startup' | 'Service' | 'Product' | 'Consulting';

// Core Topics for Interview Preparation
export enum CoreTopic {
  DSA = 'DSA',
  DBMS = 'DBMS',
  OS = 'OS',
  CN = 'CN',
  APTITUDE = 'Aptitude',
  SOFT_SKILLS = 'Soft Skills',
  SYSTEM_DESIGN = 'System Design',
}

// Proficiency Levels
export enum ProficiencyLevel {
  DEVELOPING = 'developing',
  PROFICIENT = 'proficient',
  EXPERT = 'expert',
}

// Difficulty Tiers for Quiz
export enum DifficultyTier {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

// Question Types
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  CODING = 'coding',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
}

// Topic Category Mapping
export const TOPIC_CATEGORIES: Record<CoreTopic, {
  category: 'technical' | 'aptitude' | 'skills';
  priority: number;
  description: string;
}> = {
  [CoreTopic.DSA]: {
    category: 'technical',
    priority: 1,
    description: 'Data Structures & Algorithms',
  },
  [CoreTopic.DBMS]: {
    category: 'technical',
    priority: 2,
    description: 'Database Management Systems',
  },
  [CoreTopic.OS]: {
    category: 'technical',
    priority: 3,
    description: 'Operating Systems',
  },
  [CoreTopic.CN]: {
    category: 'technical',
    priority: 4,
    description: 'Computer Networks',
  },
  [CoreTopic.APTITUDE]: {
    category: 'aptitude',
    priority: 5,
    description: 'Aptitude & Logical Reasoning',
  },
  [CoreTopic.SOFT_SKILLS]: {
    category: 'skills',
    priority: 6,
    description: 'Communication & Leadership',
  },
  [CoreTopic.SYSTEM_DESIGN]: {
    category: 'technical',
    priority: 7,
    description: 'System Design (Advanced)',
  },
};

// Year-Based Topic Relevance
export const YEAR_TOPIC_RELEVANCE: Record<StudentYear, CoreTopic[]> = {
  1: [CoreTopic.DSA, CoreTopic.APTITUDE, CoreTopic.SOFT_SKILLS],
  2: [CoreTopic.DSA, CoreTopic.DBMS, CoreTopic.OS, CoreTopic.APTITUDE, CoreTopic.SOFT_SKILLS],
  3: [CoreTopic.DSA, CoreTopic.DBMS, CoreTopic.OS, CoreTopic.CN, CoreTopic.APTITUDE, CoreTopic.SOFT_SKILLS],
  4: [CoreTopic.DSA, CoreTopic.DBMS, CoreTopic.OS, CoreTopic.CN, CoreTopic.SYSTEM_DESIGN, CoreTopic.APTITUDE, CoreTopic.SOFT_SKILLS],
};

// Self-Assessment Rating (1-5)
export type SelfRating = 1 | 2 | 3 | 4 | 5;

// Topic Self-Assessment
export interface TopicSelfAssessment {
  topicId: CoreTopic;
  selfRating: SelfRating;
  lastUpdated: string;
}

// Diagnostic Quiz Question
export interface DiagnosticQuestion {
  id: string;
  topicId: CoreTopic;
  difficulty: DifficultyTier;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  timeLimit?: number; // seconds
}

// Quiz Attempt Result
export interface QuizAttempt {
  questionId: string;
  selectedAnswer: string | number;
  isCorrect: boolean;
  timeTaken: number;
}

// Diagnostic Result
export interface DiagnosticResult {
  topicId: CoreTopic;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  averageTimePerQuestion: number;
  difficultyAttempted: DifficultyTier;
  attempts: QuizAttempt[];
  completedAt: string;
}

// Proficiency Band
export interface ProficiencyBand {
  topicId: CoreTopic;
  overallScore: number;
  selfAssessmentWeight: number;
  diagnosticWeight: number;
  level: ProficiencyLevel;
  confidence: number; // 0-100
  gaps: string[];
  lastAssessed: string;
}

// Learning Path Item
export interface LearningPathItem {
  topicId: CoreTopic;
  priority: number;
  estimatedHours: number;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  resources: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'mastered';
}

// Gap Report
export interface GapReport {
  studentId: string;
  studentYear: StudentYear;
  targetRoles: TargetRole[];
  proficiencyBands: ProficiencyBand[];
  learningPath: LearningPathItem[];
  overallReadinessScore: number;
  isReadyForInterviewPrep: boolean;
  generatedAt: string;
}

// Intake Form Data
export interface IntakeFormData {
  studentId: string;
  currentYear: StudentYear;
  targetRoles: TargetRole[];
  targetCompanyTiers: CompanyTier[];
  coveredTopics: CoreTopic[];
  skipIntake: boolean;
}

// Assessment State
export interface AssessmentState {
  intake: IntakeFormData | null;
  selfAssessments: TopicSelfAssessment[];
  diagnostics: DiagnosticResult[];
  gapReport: GapReport | null;
  status: 'not_started' | 'in_progress' | 'completed';
}