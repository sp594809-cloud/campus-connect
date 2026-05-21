import { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  CoreTopic,
  type SelfRating,
  type TopicSelfAssessment,
  TOPIC_CATEGORIES,
} from '@/core/assessmentTypes';

interface TopicConfidenceGridProps {
  initialAssessments?: TopicSelfAssessment[];
  relevantTopics?: CoreTopic[];
  onSave: (assessments: TopicSelfAssessment[]) => void;
  editable?: boolean;
}

const RATING_LABELS: Record<SelfRating, { label: string; color: string }> = {
  1: { label: 'Very Low', color: 'text-red-500' },
  2: { label: 'Low', color: 'text-orange-500' },
  3: { label: 'Medium', color: 'text-yellow-500' },
  4: { label: 'High', color: 'text-green-500' },
  5: { label: 'Expert', color: 'text-emerald-500' },
};

export function TopicConfidenceGrid({
  initialAssessments = [],
  relevantTopics,
  onSave,
  editable = true,
}: TopicConfidenceGridProps) {
  const [assessments, setAssessments] = useState<TopicSelfAssessment[]>(initialAssessments);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const topics = relevantTopics || Object.values(TopicEnum);

  useEffect(() => {
    // Initialize with default ratings if not provided
    if (assessments.length === 0 && topics.length > 0) {
      const defaults = topics.map(topic => ({
        topicId: topic,
        selfRating: 3 as SelfRating, // Default to medium
        lastUpdated: new Date().toISOString(),
      }));
      setAssessments(defaults);
    }
  }, [topics]);

  const updateRating = (topicId: CoreTopic, rating: SelfRating) => {
    setAssessments(prev =>
      prev.map(a =>
        a.topicId === topicId
          ? { ...a, selfRating: rating, lastUpdated: new Date().toISOString() }
          : a
      )
    );
  };

  const toggleExpanded = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const getRating = (topicId: CoreTopic): SelfRating => {
    return assessments.find(a => a.topicId === topicId)?.selfRating || 3;
  };

  const getAverageRating = (): number => {
    if (assessments.length === 0) return 0;
    const sum = assessments.reduce((acc, a) => acc + a.selfRating, 0);
    return sum / assessments.length;
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-card rounded-lg shadow-soft">
        <div>
          <h3 className="font-semibold">Confidence Self-Assessment</h3>
          <p className="text-sm text-muted-foreground">Rate your comfort level 1-5</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{getAverageRating().toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">average</div>
        </div>
      </div>

      {/* Topic Grid */}
      <div className="space-y-2">
        {topics.map(topic => {
          const category = TOPIC_CATEGORIES[topic];
          const rating = getRating(topic);
          const isExpanded = expandedTopics.has(topic);

          return (
            <div
              key={topic}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              {/* Topic Header */}
              <button
                onClick={() => toggleExpanded(topic)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editable) updateRating(topic, star as SelfRating);
                        }}
                        disabled={!editable}
                        className={`p-0.5 transition-transform ${
                          star <= rating
                            ? 'text-yellow-500 scale-110'
                            : 'text-muted/30'
                        } ${editable ? 'hover:scale-125 cursor-pointer' : ''}`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{topic}</p>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${RATING_LABELS[rating].color}`}>
                    {RATING_LABELS[rating].label}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border">
                  <div className="pt-3 space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        {getTopicDescription(topic)}
                      </p>
                    </div>

                    {/* Quick Rating Buttons */}
                    {editable && (
                      <div className="flex flex-wrap gap-1">
                        {([1, 2, 3, 4, 5] as SelfRating[]).map(val => (
                          <button
                            key={val}
                            onClick={() => updateRating(topic, val)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              rating === val
                                ? 'bg-primary text-primary-foreground shadow-glow'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {val} - {RATING_LABELS[val].label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      {editable && (
        <button
          onClick={() => onSave(assessments)}
          className="w-full py-3 bg-gradient-cta text-white rounded-lg font-medium shadow-glow"
        >
          Save My Ratings
        </button>
      )}
    </div>
  );
}

// Helper descriptions for each topic
function getTopicDescription(topic: CoreTopic): string {
  const descriptions: Record<CoreTopic, string> = {
    [CoreTopic.DSA]:
      'Arrays, Strings, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting, Searching, Dynamic Programming.',
    [CoreTopic.DBMS]:
      'SQL, Joins, Normalization, ACID properties, Indexing, Transactions, ER Diagrams.',
    [CoreTopic.OS]:
      'Processes, Threads, Scheduling, Deadlock, Memory Management, Virtual Memory, File Systems.',
    [CoreTopic.CN]:
      'TCP/IP, OSI Model, HTTP, DNS, Socket Programming, Network Security, Protocols.',
    [CoreTopic.APTITUDE]:
      'Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation.',
    [CoreTopic.SOFT_SKILLS]:
      'Communication, Teamwork, Problem Solving, Leadership, Behavioral Questions.',
    [CoreTopic.SYSTEM_DESIGN]:
      'Scalability, Load Balancing, Caching, Database Sharding, Microservices Architecture.',
  };
  return descriptions[topic];
}

export default TopicConfidenceGrid;