import { useState, useCallback, useMemo } from 'react';
import { BarChart3, Layers, BookOpen as BookIcon } from 'lucide-react';
import { SubjectSelection, type Subject } from './SubjectSelection';
import { TopicSelection, type SubTopic } from './TopicSelection';
import { ProgressiveQuiz, type QuizResult } from './ProgressiveQuiz';
import { LearningDashboard } from './LearningDashboard';
import { ProgressReport } from './ProgressReport';
import { useNextRecommendation } from '@/hooks/useNextRecommendation';
import { SUBJECTS, getSubject } from '@/data/preparation/subjects';
import { TOPIC_BANKS, getTopicsForSubject, getTopicBank, getAllQuestionsForTopic } from '@/data/preparation/questions';

type View = 'dashboard' | 'subjects' | 'topics' | 'quiz' | 'report';

// NOTE: localStorage is intentional here — this only stores non-sensitive
// quiz progress (topic ids, scores, time spent). No PII, no auth tokens.
// If you ever extend this to per-user cloud sync, move to Supabase instead.
const STORAGE_KEY = 'campus.prep.progress.v1';

type CompletedMap = Record<string, { completedQuestionIds: string[]; lastScore: number; timeSpent: number; difficulty: 'easy' | 'medium' | 'hard' }>;

function loadProgress(): CompletedMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompletedMap) : {};
  } catch {
    return {};
  }
}

function saveProgress(p: CompletedMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore quota errors
  }
}

export function PreparationScreen() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<SubTopic | null>(null);
  const [progress, setProgress] = useState<CompletedMap>(() => loadProgress());

  // Build topic list for the selected subject from real banks.
  const topicListForSubject = useCallback((subjectId: string): SubTopic[] => {
    return getTopicsForSubject(subjectId).map((bank) => {
      const total = bank.easy.length + bank.medium.length + bank.hard.length;
      const prog = progress[bank.id];
      const completed = prog ? prog.completedQuestionIds.length : 0;
      let status: SubTopic['status'] = 'not-started';
      if (completed > 0 && completed < total) status = 'in-progress';
      if (completed >= total && total > 0) status = 'completed';
      const difficulty: SubTopic['difficulty'] = bank.hard.length > 0 ? 'hard' : bank.medium.length > 0 ? 'medium' : 'easy';
      return {
        id: bank.id,
        name: bank.name,
        difficulty,
        questionCount: total,
        completedCount: completed,
        status,
      };
    });
  }, [progress]);

  // Per-subject completed count
  const completedMap: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    SUBJECTS.forEach((s) => {
      const topics = topicListForSubject(s.id);
      m[s.id] = topics.filter((t) => t.status === 'completed').length;
    });
    return m;
  }, [topicListForSubject]);

  // Dashboard subject summary
  const subjectProgress = SUBJECTS.map((s) => {
    const topics = topicListForSubject(s.id);
    const completed = topics.filter((t) => t.status === 'completed').length;
    const avgScore = topics.length > 0
      ? Math.round(
          topics
            .map((t) => {
              const p = progress[t.id];
              return p ? p.lastScore : 0;
            })
            .reduce((a, b) => a + b, 0) / topics.length
        )
      : 0;
    return {
      id: s.id,
      name: s.name,
      totalTopics: s.topicsCount,
      completedTopics: completed,
      averageScore: avgScore,
    };
  });

  // Topic-level snapshot for recommendations
  const allTopicProgress = useMemo(() =>
    TOPIC_BANKS.map((bank) => {
      const topics = topicListForSubject(bank.subjectId);
      const t = topics.find((x) => x.id === bank.id);
      return {
        id: bank.id,
        name: bank.name,
        subjectId: bank.subjectId,
        difficulty: (t?.difficulty ?? 'easy') as 'easy' | 'medium' | 'hard',
        status: (t?.status ?? 'not-started') as 'not-started' | 'in-progress' | 'completed',
        score: progress[bank.id]?.lastScore ?? 0,
      };
    }),
  [topicListForSubject, progress]);

  const recommendations = useNextRecommendation({
    subjects: subjectProgress,
    topics: allTopicProgress,
  });

  const totalSeconds = Object.values(progress).reduce((acc, p) => acc + (p.timeSpent || 0), 0);
  const totalHours = +(totalSeconds / 3600).toFixed(1);

  const handleSelectSubject = useCallback((subjectId: string) => {
    const meta = getSubject(subjectId);
    if (!meta) return;
    setSelectedSubject({
      id: meta.id,
      name: meta.name,
      icon: meta.icon,
      color: meta.color,
      topicsCount: meta.topicsCount,
      completedTopics: completedMap[meta.id] || 0,
      mode: meta.mode,
    });
    setView('topics');
  }, [completedMap]);

  const handleSelectTopic = useCallback((topicId: string) => {
    if (!selectedSubject) return;
    const topics = topicListForSubject(selectedSubject.id);
    const topic = topics.find((t) => t.id === topicId);
    if (topic) {
      setSelectedTopic(topic);
      setView('quiz');
    }
  }, [selectedSubject, topicListForSubject]);

  const handleBack = useCallback(() => {
    if (view === 'topics') {
      setSelectedSubject(null);
      setView('subjects');
    } else if (view === 'quiz') {
      setSelectedTopic(null);
      setView('topics');
    } else {
      setView('dashboard');
    }
  }, [view]);

  const handleQuizComplete = useCallback((result: QuizResult) => {
    if (!selectedTopic) {
      setView('dashboard');
      return;
    }
    const bank = getTopicBank(selectedTopic.id);
    const allQs = bank ? getAllQuestionsForTopic(bank.id) : [];
    const allIds = allQs.map((q) => q.id);
    const next: CompletedMap = {
      ...progress,
      [selectedTopic.id]: {
        completedQuestionIds: allIds,
        lastScore: result.totalQuestions > 0 ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0,
        timeSpent: (progress[selectedTopic.id]?.timeSpent ?? 0) + result.timeSpent,
        difficulty: result.difficulty,
      },
    };
    setProgress(next);
    saveProgress(next);
    setSelectedTopic(null);
    setView('dashboard');
  }, [progress, selectedTopic]);

  const handleContinue = useCallback((subjectId: string, topicId: string) => {
    const meta = getSubject(subjectId) || SUBJECTS.find((s) => s.name.toLowerCase() === subjectId.replace(/-/g, ' '));
    if (!meta) {
      setView('subjects');
      return;
    }
    const subj: Subject = {
      id: meta.id,
      name: meta.name,
      icon: meta.icon,
      color: meta.color,
      topicsCount: meta.topicsCount,
      completedTopics: completedMap[meta.id] || 0,
      mode: meta.mode,
    };
    setSelectedSubject(subj);
    const topics = topicListForSubject(meta.id);
    const topic = topics.find((t) => t.id === topicId);
    if (topic) {
      setSelectedTopic(topic);
      setView('quiz');
    } else {
      setView('topics');
    }
  }, [completedMap, topicListForSubject]);

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return (
          <LearningDashboard
            subjects={subjectProgress}
            recommendations={recommendations}
            onContinue={handleContinue}
            streak={0}
            totalHours={totalHours}
          />
        );
      case 'subjects':
        return (
          <SubjectSelection
            completedMap={completedMap}
            onSelectSubject={handleSelectSubject}
          />
        );
      case 'topics':
        if (!selectedSubject) return null;
        return (
          <TopicSelection
            subject={selectedSubject}
            topicList={topicListForSubject(selectedSubject.id)}
            onSelectTopic={handleSelectTopic}
            onBack={() => setView('subjects')}
          />
        );
      case 'quiz': {
        if (!selectedTopic || !selectedSubject) return null;
        const questions = getAllQuestionsForTopic(selectedTopic.id);
        return (
          <ProgressiveQuiz
            questions={questions}
            topicName={selectedTopic.name}
            subjectId={selectedSubject.id}
            onComplete={handleQuizComplete}
            onExit={handleBack}
          />
        );
      }
      case 'report': {
        const reportSubjects = SUBJECTS.map((s) => ({
          id: s.id,
          name: s.name,
          topics: getTopicsForSubject(s.id).map((bank) => {
            const p = progress[bank.id];
            const total = bank.easy.length + bank.medium.length + bank.hard.length;
            return {
              topicId: bank.id,
              topicName: bank.name,
              difficulty: (bank.hard.length > 0 ? 'hard' : bank.medium.length > 0 ? 'medium' : 'easy') as 'easy' | 'medium' | 'hard',
              score: p?.lastScore ?? 0,
              timeSpent: Math.round((p?.timeSpent ?? 0) / 60),
              attemptedAt: p ? new Date().toISOString() : '',
            };
          }),
        }));
        return (
          <ProgressReport
            subjects={reportSubjects}
            onRecalculate={() => {}}
            onContinue={handleContinue}
          />
        );
      }
      default:
        return null;
    }
  };

  const showBack = view !== 'dashboard';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={handleBack} className="p-1 hover:bg-accent rounded">
              ←
            </button>
          )}
          <h2 className="font-semibold flex items-center gap-2">
            <BookIcon className="w-4 h-4 text-primary" />
            {view === 'dashboard' && 'Preparation'}
            {view === 'subjects' && 'Select Subject'}
            {view === 'topics' && selectedSubject?.name}
            {view === 'quiz' && selectedTopic?.name}
            {view === 'report' && 'Progress Report'}
          </h2>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setView('subjects')}
            className={`p-2 rounded-lg ${view === 'subjects' || view === 'topics' || view === 'quiz' ? 'bg-secondary' : ''}`}
            title="Practice"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('report')}
            className={`p-2 rounded-lg ${view === 'report' ? 'bg-secondary' : ''}`}
            title="Report"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}
