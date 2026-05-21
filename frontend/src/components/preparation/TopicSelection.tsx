import { useState } from 'react';
import { ArrowLeft, Filter, Star, Play, CheckCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Subject } from './SubjectSelection';

export type SubTopic = {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  completedCount: number;
  status: 'not-started' | 'in-progress' | 'completed';
};

interface TopicSelectionProps {
  subject: Subject;
  topicList: SubTopic[];
  onSelectTopic: (topicId: string) => void;
  onBack: () => void;
}

type FilterType = 'all' | 'not-started' | 'in-progress' | 'completed';

export function TopicSelection({ subject, topicList, onSelectTopic, onBack }: TopicSelectionProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTopics = topicList.filter(t => filter === 'all' || t.status === filter);
  
  const counts = {
    all: topicList.length,
    'not-started': topicList.filter(t => t.status === 'not-started').length,
    'in-progress': topicList.filter(t => t.status === 'in-progress').length,
    completed: topicList.filter(t => t.status === 'completed').length,
  };

  const statusColors = {
    'not-started': { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Not Started' },
    'in-progress': { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'In Progress' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Completed' },
  };

  const difficultyStars = {
    easy: <Star key="easy" className="w-3 h-3 fill-yellow-400 text-yellow-400" />,
    medium: (
      <div key="med" className="flex">
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 -ml-1" />
      </div>
    ),
    hard: (
      <div key="hard" className="flex">
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 -ml-1" />
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 -ml-1" />
      </div>
    ),
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold">{subject.name}</h2>
          <p className="text-xs text-muted-foreground">
            {counts.completed}/{topicList.length} topics completed
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'not-started', 'in-progress', 'completed'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors",
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary"
            )}
          >
            {f === 'all' ? 'All' : statusColors[f].label} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredTopics.map(topic => (
          <button
            key={topic.id}
            onClick={() => onSelectTopic(topic.id)}
            className="w-full p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors flex items-center justify-between"
          >
            <div className="flex-1 text-left">
              <div className="font-medium">{topic.name}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {difficultyStars[topic.difficulty]}
                  <span className="capitalize">{topic.difficulty}</span>
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  {topic.completedCount}/{topic.questionCount} Q
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 text-xs rounded-full",
                statusColors[topic.status].bg,
                statusColors[topic.status].text
              )}>
                {statusColors[topic.status].label}
              </span>
              {topic.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Play className="w-5 h-5 text-primary" />
              )}
            </div>
          </button>
        ))}
        {filteredTopics.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No topics match this filter</div>
        )}
      </div>
    </div>
  );
}