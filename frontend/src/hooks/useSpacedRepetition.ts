import { useState, useEffect, useMemo, useCallback } from 'react';

// Spaced Repetition Types
export interface SpacedRepetitionItem {
  id: string;
  topicId: string;
  lastPracticed: Date | null;
  strengthScore: number; // 0-100
  
  // Spaced Repetition Fields:
  nextReviewDate: Date | null;
  reviewCount: number;
  forgettingCurve: number; // Days until likely forgotten
}

export interface ReviewPriority {
  item: SpacedRepetitionItem;
  priority: 'overdue' | 'new' | 'weak' | 'mastered';
  daysUntilReview: number;
}

// Spaced Repetition Constants
const DEFAULT_FORGETTING_CURVE = 7; // Days before likely forgotten
const KNOWLEDGE_DECAY_RATE = 0.15; // Per day decay

/**
 * Calculate next review date based on SM-2 algorithm variation
 */
export function calculateNextReview(
  currentStrength: number,
  wasCorrect: boolean,
  reviewCount: number,
  previousCurve: number
): { nextDate: Date; newStrength: number; newCurve: number } {
  let newCurve = previousCurve;
  let newStrength = currentStrength;

  if (wasCorrect) {
    // Correct: Increase interval
    newCurve = Math.min(30, Math.max(previousCurve * 1.5, 1)); // Cap at 30 days
    newStrength = Math.min(100, currentStrength + (100 - currentStrength) * 0.3);
  } else {
    // Incorrect: Decrease interval significantly
    newCurve = Math.max(1, previousCurve * 0.5);
    newStrength = Math.max(0, currentStrength - 15);
  }

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + Math.ceil(newCurve));

  return { nextDate, newStrength, newCurve };
}

/**
 * Check if item is due for review
 */
export function isDueForReview(item: SpacedRepetitionItem): boolean {
  if (!item.nextReviewDate) return true; // Never practiced = new
  return new Date() >= item.nextReviewDate;
}

/**
 * Get the priority level for an item
 */
export function getReviewPriority(item: SpacedRepetitionItem): ReviewPriority['priority'] {
  if (!item.lastPracticed) return 'new';
  if (item.strengthScore >= 80) return 'mastered';
  if (isDueForReview(item)) return 'overdue';
  return 'weak';
}

/**
 * Main hook for spaced repetition logic
 */
export function useSpacedRepetition(initialItems: SpacedRepetitionItem[] = []) {
  const [items, setItems] = useState<SpacedRepetitionItem[]>(initialItems);

  /**
   * Record a practice result
   */
  const recordResult = useCallback((
    itemId: string,
    wasCorrect: boolean
  ) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const { nextDate, newStrength, newCurve } = calculateNextReview(
        item.strengthScore,
        wasCorrect,
        item.reviewCount,
        item.forgettingCurve
      );

      return {
        ...item,
        lastPracticed: new Date(),
        strengthScore: newStrength,
        nextReviewDate: nextDate,
        forgettingCurve: newCurve,
        reviewCount: item.reviewCount + 1,
      };
    }));
  }, []);

  /**
   * Add a new item to track
   */
  const addItem = useCallback((topicId: string) => {
    const newItem: SpacedRepetitionItem = {
      id: `${topicId}-${Date.now()}`,
      topicId,
      lastPracticed: null,
      strengthScore: 0,
      nextReviewDate: null,
      reviewCount: 0,
      forgettingCurve: DEFAULT_FORGETTING_CURVE,
    };
    
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  /**
   * Get items sorted by review priority
   */
  const prioritizedItems = useMemo((): ReviewPriority[] => {
    return items.map(item => {
      const priority = getReviewPriority(item);
      const daysUntilReview = item.nextReviewDate
        ? Math.ceil((item.nextReviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      return { item, priority, daysUntilReview };
    }).sort((a, b) => {
      // Sort by priority: overdue > new > weak > mastered
      const order = { overdue: 0, new: 1, weak: 2, mastered: 3 };
      return order[a.priority] - order[b.priority];
    });
  }, [items]);

  /**
   * Get recommendation for next item to study
   */
  const getNextRecommendation = useCallback((): SpacedRepetitionItem | null => {
    const sorted = [...items].sort((a, b) => {
      // Overdue items first
      if (a.nextReviewDate && !b.nextReviewDate) return -1;
      if (!a.nextReviewDate && b.nextReviewDate) return 1;
      
      // By next review date
      if (a.nextReviewDate && b.nextReviewDate) {
        return a.nextReviewDate.getTime() - b.nextReviewDate.getTime();
      }
      
      // New items before weak
      if (!a.lastPracticed && b.lastPracticed) return -1;
      if (a.lastPracticed && !b.lastPracticed) return 1;
      
      // Lower strength first
      return a.strengthScore - b.strengthScore;
    });
    
    return sorted[0] || null;
  }, [items]);

  return {
    items,
    prioritizedItems,
    recordResult,
    addItem,
    getNextRecommendation,
  };
}

export default useSpacedRepetition;