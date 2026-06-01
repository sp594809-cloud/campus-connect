## 1. Remove the "Prepare" feature completely

**Frontend deletions**
- Delete folders: `src/components/preparation/` (entire), `src/components/assessment/` (entire), `src/data/preparation/` (entire), `src/hooks/useGapAnalysis.ts`, `src/hooks/useNextRecommendation.ts`, `src/hooks/useSpacedRepetition.ts`, `src/core/assessmentTypes.ts`, `src/integrations/supabase/preparation.ts`, `src/lib/api/learn.ts`.
- Edit `src/components/campus/BottomNav.tsx`: remove `"prepare"` from `Tab` union and remove the Prepare nav item; ensure remaining tabs still fit the bar.
- Edit `src/pages/CampusApp.tsx`: drop the `PreparationScreen` import and the `{tab === "prepare"}` branch.
- Backend Python: delete `backend/routers/learn.py` and unregister it in `backend/server.py` (the FastAPI side mirrors the same feature).

**Edge functions to delete (via delete_edge_functions)**
- `prep-placement-quiz`, `prep-generate-plan`, `prep-grade-submission`, `generate-prep-task`.

**Database migration (drop tables + types)**
```sql
DROP TABLE IF EXISTS public.task_submissions CASCADE;
DROP TABLE IF EXISTS public.daily_tasks CASCADE;
DROP TABLE IF EXISTS public.user_learning_plans CASCADE;
DROP TABLE IF EXISTS public.track_topics CASCADE;
DROP TABLE IF EXISTS public.learning_tracks CASCADE;
DROP TABLE IF EXISTS public.preparation_progress CASCADE; -- if present
```
DSA streaks and karma stay (used by other features).

## 2. News UX upgrade

**Company news (`CompanyNewsCard` + `CompanyDetailScreen`)**
- Redesign card: source favicon + name chip, relative time ("2h ago"), 2-line title clamp, optional thumbnail with rounded `aspect-video`, subtle hover lift, tap-target ≥ 44px.
- Skeleton state (3 shimmer cards) and friendly empty state with retry.
- Group by date ("Today / This week / Earlier").

**Branch news (`CompaniesScreen`)**
- Promote branch-news to a horizontal "For your branch" rail at the top with snap scrolling, category emoji chip, gradient overlay headlines.
- Pull-to-refresh trigger button, last-updated timestamp, error toast on failure.
- Sticky filter chips (All / Tech / Internships / Hiring).

## 3. Minor UI polish — tokens + key screens

**`src/index.css` token pass** (HSL only)
- Tighten neutral ramp, add `--surface`, `--surface-elevated`, `--border-strong`.
- New `--shadow-card`, `--shadow-pop`, `--gradient-subtle` tokens.
- Slightly warmer primary + softer destructive for dark mode parity.

**Apply to**: HomeScreen, DiscoverScreen, MessagesScreen, CompaniesScreen, ProfileScreen, sticky header in `CampusApp`, `TierPill`, `BottomNav` active indicator (animated pill), `FloatingActions` (better shadow + press state). All via semantic classes — no hardcoded colors.

## Technical notes
- Run migrations BEFORE editing code that references the dropped tables to avoid TS noise; `types.ts` auto-regenerates.
- After deleting edge functions, also remove their entries from `supabase/config.toml` if present.
- Verify no remaining imports of deleted modules with a final ripgrep sweep.

## Out of scope
- Restructuring backend FastAPI beyond removing the learn router.
- New news data source / scraping changes.
- Typography swap or animation framework changes.