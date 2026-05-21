import { useState, useCallback } from 'react';
import { GraduationCap, BarChart3, Layers } from 'lucide-react';
import { SubjectSelection, type Subject } from './SubjectSelection';
import { TopicSelection, type SubTopic } from './TopicSelection';
import { ProgressiveQuiz, type QuizResult } from './ProgressiveQuiz';
import { LearningDashboard, type Recommendation } from './LearningDashboard';
import { ProgressReport, type SubjectScore } from './ProgressReport';
import { useNextRecommendation } from '@/hooks/useNextRecommendation';

// Demo data
const DEMO_SUBJECTS: Subject[] = [
  { id: 'dsa', name: 'DSA', icon: GraduationCap, color: 'text-blue-500', topicsCount: 12, completedTopics: 3 },
  { id: 'dbms', name: 'DBMS', icon: GraduationCap, color: 'text-green-500', topicsCount: 8, completedTopics: 0 },
  { id: 'os', name: 'OS', icon: GraduationCap, color: 'text-purple-500', topicsCount: 6, completedTopics: 0 },
];

const DEMO_TOPICS: Record<string, SubTopic[]> = {
  dsa: [
    { id: 'arrays', name: 'Arrays', difficulty: 'easy', questionCount: 10, completedCount: 3, status: 'completed' },
    { id: 'linkedlist', name: 'Linked Lists', difficulty: 'easy', questionCount: 10, completedCount: 0, status: 'not-started' },
    { id: 'stacks', name: 'Stacks', difficulty: 'medium', questionCount: 10, completedCount: 0, status: 'not-started' },
  ],
};

type View = 'dashboard' | 'subjects' | 'topics' | 'quiz' | 'report';

export function PreparationScreen() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<SubTopic | null>(null);

  // Calculate subject progress map
  const completedMap: Record<string, number> = {};
  DEMO_SUBJECTS.forEach(s => { completedMap[s.id] = s.completedTopics; });

  const subjectProgress = DEMO_SUBJECTS.map(s => ({
    id: s.id,
    name: s.name,
    totalTopics: s.topicsCount,
    completedTopics: s.completedTopics,
    averageScore: s.completedTopics > 0 ? 70 : 0,
  }));

  const recommendations = useNextRecommendation({
    subjects: subjectProgress,
    topics: [],
  });

  const handleSelectSubject = useCallback((subjectId: string) => {
    const subject = DEMO_SUBJECTS.find(s => s.id === subjectId);
    if (subject) {
      setSelectedSubject(subject);
      setView('topics');
    }
  }, []);

  const handleSelectTopic = useCallback((topicId: string) => {
    if (!selectedSubject) return;
    const topics = DEMO_TOPICS[selectedSubject.id] || [];
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      setSelectedTopic(topic);
      setView('quiz');
    }
  }, [selectedSubject]);

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
    console.log('Quiz completed:', result);
    setSelectedTopic(null);
    setView('dashboard');
  }, []);

  const handleContinue = useCallback((subjectId: string, topicId: string) => {
    const subject = DEMO_SUBJECTS.find(s => s.id === subjectId);
    if (subject) {
      setSelectedSubject(subject);
      const topics = DEMO_TOPICS[subject.id] || [];
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        setSelectedTopic(topic);
        setView('quiz');
      } else {
        setView('topics');
      }
    }
  }, []);

  // Render views
  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return (
          <LearningDashboard
            subjects={subjectProgress}
            recommendations={recommendations}
            onContinue={handleContinue}
            streak={5}
            totalHours={12}
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
            topicList={DEMO_TOPICS[selectedSubject.id] || []}
            onSelectTopic={handleSelectTopic}
            onBack={() => setView('subjects')}
          />
        );

      case 'quiz':
        if (!selectedTopic) return null;
        return (
          <ProgressiveQuiz
            questions={[]}
            topicName={selectedTopic.name}
            onComplete={handleQuizComplete}
            onExit={handleBack}
          />
        );

      case 'report':
        return (
          <ProgressReport
            subjects={[]}
            onRecalculate={() => {}}
            onContinue={handleContinue}
          />
        );

      default:
        return null;
    }
  };

  // Determine show back button
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
          <h2 className="font-semibold">
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
            className={`p-2 rounded-lg ${view !== 'dashboard' ? 'bg-secondary' : ''}`}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}