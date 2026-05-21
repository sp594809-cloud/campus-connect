# 1. OBJECTIVE
Build a completely NEW Preparation Function that features proper quiz flow: subject selection → topic selection → progressive questions (easy→medium→hard) with correct UX where users MUST answer before moving to next question, plus full learning dashboard showing progress and "what to do next" recommendations.

# 2. CONTEXT SUMMARY
- **Platform**: Campus Connect (React + TypeScript + Vite)
- **Current Problems**:
  1. Quiz auto-advances without user answering (1→2→3 moves automatically)
  2. No visibility of learning process (don't know what to do next)
  3. No progress report showing student learning status
  
- **Problems to Fix**: New quiz flow with forced answer submission, learning dashboard, progress tracking

# 3. APPROACH OVERVIEW
New 3-Phase Learning System:

**Phase 1: Subject & Topic Selection**
- Show all subjects (DSA, DBMS, OS, CN, Aptitude, System Design)
- Each subject has multiple topics inside
- User selects ONE topic to practice

**Phase 2: Progressive Question Flow**
- Level-based: Easy → Medium → Hard (must complete each set)
- MUST answer question before "Next" button becomes active
- Immediate feedback: show correct/incorrect + explanation
- Cannot skip or auto-advance
- Each difficulty has 5-10 questions minimum

**Phase 3: Learning Dashboard**
- Overall progress percentage
- Per-topic breakdown (completed/in-progress/not-started)
- "What to do next" - clear recommendations
- Strengths and Weaknesses analysis
- Streak and achievements

# 4. IMPLEMENTATION STEPS

**Step 1: Create Subject Selection Screen**
- Goal: Allow user to select which subject to practice
- Method:
  - Display all subjects as cards with icons
  - Show progress indicator per subject
  - Include: DSA, DBMS, OS, CN, Aptitude, Soft Skills, System Design
- Reference: New `src/components/preparation/SubjectSelection.tsx`

**Step 2: Create Topic Selection Screen**
- Goal: Show topics within selected subject
- Method:
  - List all topics for chosen subject
  - Show difficulty level and question count
  - Allow filtering: Not Started / In Progress / Completed
- Reference: New `src/components/preparation/TopicSelection.tsx`

**Step 3: Build Fixed Progressive Quiz Component**
- Goal: Quiz that ONLY advances after answering
- Method:
  - Questions stored in ordered array (Easy first, then Medium, then Hard)
  - "Next" button disabled until user SELECTS an answer
  - After selecting answer, user must click "Submit" to check
  - Show result (correct/incorrect) + explanation
  - "Next" appears only AFTER submit
  - Cannot auto-advance - forced user action
- Reference: Replace `src/components/assessment/DiagnosticQuiz.tsx` with new `src/components/preparation/ProgressiveQuiz.tsx`

**Step 4: Create Question Bank per Difficulty**
- Goal: Enough questions at each difficulty level
- Method:
  - Easy: 10 questions per topic
  - Medium: 10 questions per topic
  - Hard: 10 questions per topic
  - Generate from AI when needed (see note below)
  - Store in organized structure by topic and difficulty
- Reference: `src/data/preparation/questions/` folder with topic-based files

**Note on Question Generation**: Questions can be dynamically generated when needed using AI - this is acceptable as it creates NEW questions in similar patterns, not exact copies of copyrighted material.

**Step 5: Build Learning Dashboard**
- Goal: Show complete learning status and what to do next
- Method:
  - Overall progress ring/chart
  - Per-topic cards with status indicators
  - "Continue Learning" prominent CTA
  - Recent activity history
  - Upcoming recommendations based on gaps
- Reference: New `src/components/preparation/LearningDashboard.tsx`

**Step 6: Create Progress Report Card**
- Goal: Detailed learning analysis
- Method:
  - Score breakdown per topic
  - Time spent learning
  - Accuracy percentage
  - Strong areas (green)
  - Areas to improve (red/orange)
  - Suggested next steps
- Reference: New `src/components/preparation/ProgressReport.tsx`

**Step 7: Build "What to Do Next" Engine**
- Goal: Intelligent recommendations
- Method:
  - Analyze completed topics
  - Check partially completed topics
  - Recommend next easiest uncompleted topic
  - Show expected difficulty level
- Reference: New `src/hooks/useNextRecommendation.ts`

**Step 8: Add Progress Persistence**
- Goal: Save learning progress to database
- Method:
  - Store in Supabase: `preparation_progress` table
  - Track: topic_id, difficulty, score, time_spent, completed_at
  - Sync across devices
- Reference: New `src/integrations/supabase/preparation.ts`

**Step 9: Integrate into Campus Navigation**
- Goal: Add "Prepare" entry point
- Method:
  - Add new bottom nav item or menu option
  - Link directly to dashboard
  - Show badge for pending learning
- Reference: Update `CampusApp.tsx` and `BottomNav.tsx`

**Step 10: Build Completion & Celebration**
- Goal: Motivational rewards
- Method:
  - Confetti on topic completion
  - Badges for milestones (first topic, all easy completed, etc.)
  - Share achievement capability
- Reference: Add to `LearningDashboard.tsx`

# 5. TESTING AND VALIDATION

**Subject Selection**: All subjects visible with progress indicators
**Topic Selection**: Topics filter by status correctly
**Progressive Quiz Flow**: 
- Answer MUST be selected before Submit enables
- NEXT only appears after SUBMIT clicked
- No auto-advance - intentional button clicks required
- Questions progress Easy → Medium → Hard in order
**Learning Dashboard**:
- Shows overall progress percentage
- "What to do next" prominently displayed
- Clear visual indicators for done/not-done
**Progress Report**:
- Accurate score breakdown per topic
- Strengths shown in green
- Weaknesses highlighted with recommendations
**Persistence**: Progress saves and restores correctly

---

## KEY UX RULES (Critical)

1. **NEVER auto-advance** - User MUST click to proceed
2. **Require explicit answer selection** before enabling submit
3. **Immediate feedback** after each answer
4. **Clear progress visibility** at all times
5. **One-click "What to do next"** always available
