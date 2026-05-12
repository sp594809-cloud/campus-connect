## Overview

Two large modules requested:
1. **Employability Passport** — public student profile with Proof-of-Work visualizations
2. **Recruiter Dashboard** — recruiter-only talent discovery with leaderboard, filters, analytics

Both depend on existing tables (`profiles`, `karma_events`, `dsa_streaks`, `dsa_completions`, `posts`). Before I build, I need a few decisions because the spec references columns and roles that don't currently exist in your schema.

---

## Schema gaps I need to resolve

The spec asks for fields/roles that aren't in the database today:

| Requested | Status in DB | Proposed handling |
|---|---|---|
| `username`, `college_name`, `graduation_year`, `verified` on profiles | Not present | Add columns to `profiles` (nullable). Use `profile.id` as the route slug if `username` is empty. |
| `role = 'recruiter'` | No roles table | Create `app_role` enum (`student`, `recruiter`, `admin`) + `user_roles` table + `has_role()` SECURITY DEFINER function (per security best-practice). |
| Recruiter saved candidates / notes / shortlist | Not present | New tables: `recruiter_saved_candidates`, `recruiter_notes`. |
| Karma category mapping (interview_experience, mentorship, etc.) | `karma_events.action` enum exists with different values | Map existing actions → display categories in the frontend. |

---

## Plan

### Phase 1 — Migration
- Add `username` (unique, nullable), `college_name`, `graduation_year`, `verified` to `profiles`.
- Create `app_role` enum + `user_roles` table + `has_role(uuid, app_role)` function + RLS.
- Create `recruiter_saved_candidates` and `recruiter_notes` (RLS: recruiter-only).
- Add indexes: `profiles(karma_total DESC)`, `profiles(branch)`, GIN on `profiles(skills)`, `profiles(placement_status)`.
- Create SQL view `employability_score_view` aggregating karma + streak + post counts per profile.

### Phase 2 — Employability Passport (`/passport/:slug`)
Reusable components in `src/components/passport/`:
- `PassportHeader.tsx` — avatar, name, branch, college, placement, karma, verified badge, CTAs (Connect / Message / Download Resume / Verify).
- `EmployabilityScoreCard.tsx` — weighted score (0–100) with 4 sub-bars (Consistency, Peer Contribution, Technical Discipline, Community Impact).
- `KarmaHeatmap.tsx` — GitHub-style 365-day grid from `karma_events`, color-coded by category, intensity by daily points.
- `StreakCalendar.tsx` — month-grid of `dsa_completions` with current/longest streak stats and animated flame.
- `PlacementTimeline.tsx` — vertical timeline from `posts` filtered by relevant tags/types.
- `RecruiterInsightCard.tsx` — auto-generated insight bullets from frontend logic.
- Skeletons + empty states for every section.

Page: `src/pages/Passport.tsx`. Route added to `App.tsx`. Public read (RLS already permits authenticated SELECT on profiles).

### Phase 3 — Recruiter Dashboard (`/recruiter/dashboard`, `/recruiter/student/:id`)
- `RecruiterGuard` HOC checks `has_role(uid, 'recruiter')`; otherwise redirect.
- `src/pages/RecruiterDashboard.tsx`:
  - Overview metric cards (active students, 30+ streak, top karma, most active branch, verified, recently placed).
  - `RecruiterLeaderboard.tsx` — sortable, paginated, infinite scroll on `employability_score_view`.
  - `TalentFilters.tsx` — branch / year / placement / verified / skills / streak range / karma range.
  - Full-text search (ILIKE on name + skills + branch).
- `src/pages/RecruiterStudentDetail.tsx`:
  - Reuses Passport components + recruiter-only analytics panel + actions (Save / Contact / Invite / Shortlist / Note).
- `EmployabilityRadar.tsx` (Recharts radar of 4 sub-scores).
- `SkillAnalytics.tsx` (top skills by branch, frequency bar chart).
- `CandidateCard.tsx` for grid view.

### Phase 4 — Polish
- Dark/light mode using existing semantic tokens (no raw colors).
- Mobile responsive.
- All Supabase queries typed via generated `Database` types.

---

## Clarifying questions (please answer before I build)

I need 3 quick answers — see the questions panel.

## Technical notes
- Recharts is not yet installed; I'll add it.
- Heatmap will be hand-rolled with Tailwind grid (no extra dep).
- Roles enforced via `has_role()` SECURITY DEFINER function in RLS — no client-side role checks.
- "Download Resume" will be a placeholder button unless you point to a resume field/bucket.
- "Verify Student" button will only be visible/functional for users with `admin` role.
