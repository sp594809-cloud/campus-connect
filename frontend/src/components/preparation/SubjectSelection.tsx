import { useState } from 'react';
import { Brain, Database, Cpu, Wifi, Calculator, Users, Scale, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Subject = {
  id: string;
  name: string;
  icon: typeof Brain;
  color: string;
  topicsCount: number;
  completedTopics: number;
};

const SUBJECTS: Omit<Subject, 'completedTopics'>[] = [
  { id: 'dsa', name: 'DSA', icon: Brain, color: 'text-blue-500', topicsCount: 12 },
  { id: 'dbms', name: 'Database', icon: Database, color: 'text-green-500', topicsCount: 8 },
  { id: 'os', name: 'Operating Systems', icon: Cpu, color: 'text-purple-500', topicsCount: 6 },
  { id: 'cn', name: 'Computer Networks', icon: Wifi, color: 'text-orange-500', topicsCount: 5 },
  { id: 'aptitude', name: 'Aptitude', icon: Calculator, color: 'text-yellow-500', topicsCount: 10 },
  { id: 'softskills', name: 'Soft Skills', icon: Users, color: 'text-pink-500', topicsCount: 4 },
  { id: 'systemdesign', name: 'System Design', icon: Scale, color: 'text-indigo-500', topicsCount: 5 },
];

interface SubjectSelectionProps {
  completedMap?: Record<string, number>;
  onSelectSubject: (subjectId: string) => void;
}

export function SubjectSelection({ completedMap = {}, onSelectSubject }: SubjectSelectionProps) {
  const subjects: Subject[] = SUBJECTS.map(s => ({
    ...s,
    completedTopics: completedMap[s.id] || 0,
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Choose Subject</h2>
        <p className="text-muted-foreground">Select a subject to practice</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {subjects.map((subject) => {
          const progress = subject.topicsCount > 0 ? (subject.completedTopics / subject.topicsCount) * 100 : 0;
          const isCompleted = subject.completedTopics === subject.topicsCount && subject.topicsCount > 0;
          
          return (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              className={cn(
                "relative p-4 rounded-xl border transition-all duration-200 text-left",
                "hover:shadow-md hover:border-primary/50",
                isCompleted 
                  ? "bg-green-500/10 border-green-500/30" 
                  : "bg-card border-border hover:bg-accent"
              )}
            >
              <subject.icon className={cn("w-8 h-8 mb-2", subject.color)} />
              
              <div className="font-medium">{subject.name}</div>
              
              <div className="text-xs text-muted-foreground mt-1">
                {subject.completedTopics}/{subject.topicsCount} topics
              </div>

              {/* Progress bar */}
              {progress > 0 && (
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      isCompleted ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Completion indicator */}
              {isCompleted && (
                <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-500" />
              )}

              <ChevronRight className="absolute bottom-2 right-2 w-4 h-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}