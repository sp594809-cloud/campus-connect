# 1. OBJECTIVE
Create a Discovery-First Personalized Learning System that assesses each student's current skill level, identifies learning gaps, and generates a personalized learning path before entering interview preparation. This system differentiates content based on student year (1st to 4th year) and focuses on filling knowledge gaps first.

# 2. CONTEXT SUMMARY
- **Platform**: Campus Connect (React + TypeScript + Vite)
- **Tech Stack**: React, TypeScript, Supabase, Firebase, React Router, TanStack Query
- **Problem**: Students (1st to 4th year) have varying skill levels, but current platform jumps straight to interview prep without assessing readiness
- **Solution**: Discovery phase to assess → Gap analysis → Personalized learning path → Then interview prep
- **Core Topics**: DSA, DBMS, OS, CN, Aptitude, Soft Skills, System Design (for advanced students)
- **Competency Framework**: Using research-backed proficiency bands (Developing → Proficient → Expert)

# 3. APPROACH OVERVIEW
Five-phase discovery system:
1. **Self-Report Intake**: Student selects year, target companies, topics already covered
2. **Confidence Self-Assessment**: Rate confidence 1-5 on each core topic
3. **Adaptive Diagnostic Quiz**: Short quiz that adapts difficulty based on answers
4. **Gap Analysis**: Generate proficiency bands and identifyweaknesses
5. **Personalized Learning Path**: Recommend topics to focus on, ordered by priority

The system maintains student profiles with their proficiency history, enabling progressive tracking throughout their campus journey.

# 4. IMPLEMENTATION STEPS

**Step 1: Define competency framework and data types**
- Goal: Create TypeScript interfaces for assessment system
- Method:
  - Define core topics with categories: DSA, DBMS, OS, CN, Aptitude, Soft Skills, System Design
  - Create proficiency levels enum: developing, proficient, expert
  - Define assessment question types
  - Map topics to student years (foundation → intermediate → advanced)
- Reference: New file `src/core/assessmentTypes.ts`

**Step 2: Create discovery/intake form**
- Goal: Collect initial student data for assessment
- Method:
  - Create `DiscoveryIntake.tsx` component
  - Fields: current year (1-4), target roles (SDE, Data Science, etc.), target company types
  - Optional skip with "quick start" option for returning students
- Reference: New component in `src/components/assessment/`

**Step 3: Build confidence self-assessment component**
- Goal: Let students rate their own confidence per topic
- Method:
  - Create `TopicConfidenceGrid.tsx` component
  - Display all core topics with slider/rating (1-5 stars)
  - Show topic descriptions for clarity
  - Save self-ratings to student profile
- Reference: New component in `src/components/assessment/`

**Step 4: Create adaptive diagnostic quiz engine**
- Goal: Generate short quizzes that adapt difficulty based on answers
- Method:
  - Create `DiagnosticQuiz.tsx` component
  - Implement question pool per topic with difficulty tiers
  - Track streak and adjust difficulty mid-quiz
  - Timeout handling and progress saving
  - Quick 5-10 question format (not exhaustive)
- Reference: New component in `src/components/assessment/`

**Step 5: Build gap analysis engine**
- Goal: Calculate proficiency bands and identify learning gaps
- Method:
  - Create `useGapAnalysis.ts` hook
  - Combine self-assessment + diagnostic results
  - Weight scoring: self-confidence (30%) + diagnostic (70%)
  - Calculate proficiency bands per topic
  - Rank gaps by severity and importance
- Reference: New hook in `src/hooks/`

**Step 6: Generate personalized learning path**
- Goal: Create actionable learning recommendations
- Method:
  - Create `LearningPathGenerator.ts` utility
  - Based on gap analysis results
  - Order topics by: gap severity + student year relevance
  - Generate "What to learn next" ordered list
  - Include estimated time per topic
- Reference: New utility in `src/lib/assessment/`

**Step 7: Create Gap Report UI**
- Goal: Display assessment results visually
- Method:
  - Create `GapReportCard.tsx` component
  - Visual proficiency bands using colors (red → yellow → green)
  - Show "priority queue" of topics to learn
  - Export/share capability for mentorship discussions
- Reference: New component in `src/components/assessment/`

**Step 8: Integrate assessment into Campus App**
- Goal: Add assessment entry point in navigation
- Method:
  - Add new tab or section in CampusApp for "Prepare"
  - Link to discovery flow from existing navigation
  - Show assessment status badge (not started / in progress / complete)
- Reference: `src/pages/CampusApp.tsx`

**Step 9: Create learning path tracking**
- Goal: Track progress through personalized learning path
- Method:
  - Create `LearningProgressTracker.tsx` component
  - Mark topics as "learning", "practicing", "mastered"
  - Re-assess option after completing topic
  - Connect with existing Karma/Badge system
- Reference: New component in `src/components/assessment/`

**Step 10: Build bridge to interview prep**
- Goal: Unlock interview prep only after foundation readiness
- Method:
  - Create `PrepReadinessGate.tsx` component
  - Minimum threshold: 50%+ topics at "Proficient" or above
  - Below threshold: Redirect to learning path
  - Above threshold: Unlock interview prep features
- Reference: Component integrates with existing interview features

# 5. TESTING AND VALIDATION
- **Intake Form**: User can complete intake in under 2 minutes
- **Confidence Grid**: All topics displayed with clear rating interface
- **Diagnostic Quiz**: Completes in 5-10 minutes with adaptive difficulty
- **Gap Report**: Shows clear color-coded proficiency per topic
- **Learning Path**: Generates ordered "next steps" list
- **Year Differentiation**: 1st year sees fundamentals, 4th year sees advanced
- **Progress Tracking**: Can update proficiency as they learn
- **Prep Gate**: Blocks interview prep until ready (optional bypass)
- **Integration**: Connected with existing Campus navigation
