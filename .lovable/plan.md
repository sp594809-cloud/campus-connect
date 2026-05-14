# Production Hardening Plan

Goal: improve architecture, security, perf, and reliability **without changing any UI, flows, colors, animations, or features**. All changes are additive or internal refactors. Risky items are flagged and gated behind your approval.

I'll execute in phases. You can approve all, or pick phases.

---

## Phase 1 — Auth & Protected Routes (low risk)

- Add a `<RequireAuth>` and `<RequireRole role="recruiter|admin">` wrapper component, used in `App.tsx` for `/campus`, `/me`, `/onboarding`, `/recruiter/*`. Keeps current redirects, just centralizes them (today they live inside each page).
- Tighten `useRecruiterRole` to use React Query with caching (avoid refetching `has_role` on every mount).
- Add session-refresh resilience: `supabase.auth.onAuthStateChange` handler already exists in `AuthContext`; add a `TOKEN_REFRESHED` branch + a `visibilitychange` listener to re-validate session on tab focus.
- Keep all existing redirects/behavior identical.

## Phase 2 — React Query & Data Layer (low risk, pure refactor)

- Configure `QueryClient` defaults (staleTime 30s, retry 1, refetchOnWindowFocus false) — fixes duplicate-request issue.
- Introduce `src/lib/api/` query-key factory (`qk.profile(id)`, `qk.connections()`, `qk.materials()`, etc.) and convert ad-hoc `supabase.from(...)` calls in hot screens (Header, HomeScreen, MarketplaceScreen, PassportHeader) to `useQuery` where they currently use `useEffect + useState`. No UI change.
- Centralize the `MiniProfile` type in `src/core/types.ts` (already partially there) and remove the duplicate in `src/lib/api/profiles.ts`.

## Phase 3 — Component Splitting & TS Cleanup (low risk)

- Split `MarketplaceScreen.tsx` and `CampusApp.tsx` into smaller presentational + container pieces (file-level refactor; no JSX/visual diffs).
- Replace remaining `any` casts in `chart.tsx`, recruiter pages, and Supabase query results with proper generics from `Database` types.
- Add `React.memo` + stable callbacks for `BottomNav`, `TierPill`, `FloatingActions` (frequent re-render culprits in the persistent shell).

## Phase 4 — Error Boundaries & Loading (low risk)

- Wrap each top-level route in `LazyErrorBoundary` (currently only used inside one place).
- Add a shared `<AsyncBoundary>` (Suspense + ErrorBoundary) for data-loading sections.
- Replace silent `.catch(() => {})` patterns with `toast.error` + `console.error`.

## Phase 5 — Database / RLS Hardening (medium risk — migration)

Verified safe additions only:

- **Add foreign keys** (currently missing — schema shows "No foreign keys" almost everywhere):
  - `profiles.id` → `auth.users(id) ON DELETE CASCADE`
  - `karma_events.user_id`, `dsa_streaks.user_id`, `dsa_completions.user_id` → `profiles(id) ON DELETE CASCADE`
  - `connection_requests.requester_id/recipient_id`, `messages.conversation_id`, `messages.sender_id`, `conversations.user_a/user_b`, `community_members.*`, `community_messages.*`, `post_likes.*`, `post_comments.*`, `posts.author_id`, `marketplace_listings.seller_id`, `study_materials.seller_id/listing_id`, `study_material_secrets.material_id`, `material_purchases.*`, `interview_experiences.author_id`, `interview_rounds.experience_id`, `event_rsvps.*`, `events.created_by`, `mentorship_requests.*`, `recruiter_notes.*`, `recruiter_saved_candidates.*`, `user_roles.user_id`.
  - All added with `NOT VALID` first, then validated, so they can't break existing rows.
- **Add missing indexes** on FK columns + frequently filtered columns (`karma_events(user_id, created_at)`, `messages(conversation_id, created_at)`, `connection_requests(recipient_id, status)`, `post_likes(post_id)`, `material_purchases(buyer_id)`, etc.).
- **`profiles.SELECT` policy review**: currently every authenticated user can read every profile column including `resume_url`, `linkedin`, `github`. I'll add a `public_profiles` view that excludes potentially sensitive fields and leave the table policy as-is for backward compat (recruiter dashboard depends on it). Optional follow-up: switch app reads to the view.
- **`college_roster`**: confirmed unused in code. I'll keep the table but ensure RLS denies all (no policies = effectively denied; verify).
- **`otp_codes`**: RLS enabled, no policies, accessed only via edge functions w/ service role — already safe. Add a comment + a cleanup function `delete from otp_codes where expires_at < now() - interval '1 day'` callable from a cron.
- **Tighten `community_messages`/`messages` insert** with length limits (`length(content) <= 4000`).

## Phase 6 — Edge Function Hardening (low risk)

- Add a shared `validate.ts` in `supabase/functions/_shared/` with zod schemas for each action body.
- Add per-user in-memory rate limiting (60 req/min) in `material-ai`, `chat-with-pdf`, `send-otp` (OTP already needs this most).
- Add structured error responses `{error, code}` and never leak raw exception messages.
- Cap `query` length, `material_id` UUID validation, file-size guard for PDF prepare.

## Phase 7 — Performance / Bundle (low risk)

- Convert route components in `App.tsx` to `React.lazy` + `Suspense` (currently all eagerly imported — biggest single bundle win).
- Add `vite` `manualChunks` for `recharts`, `framer-motion`, `@supabase/supabase-js`.
- Memoize expensive recruiter/passport selectors.

## Phase 8 — Tests (low risk)

- Add vitest tests for: `employability.ts` scoring, `useRecruiterRole`, RequireAuth redirect logic, profile reducer in `AuthContext`, lookup RPC fallbacks.

---

## Risky / Manual-Review Items (will NOT do without explicit OK)

- Dropping `college_roster` (kept).
- Changing `profiles` SELECT to restrict columns (would touch many components).
- Changing `pgvector` extension schema.
- Any change to storage bucket public/private flags.

## What stays untouched

- All screens, styles, animations, colors, layouts, copy.
- All existing routes & redirects.
- All edge function behavior (only validation/limits added).
- All RLS policies that currently work — only additive constraints/FKs/indexes.

---

**Please confirm**:
1. Proceed with **all 8 phases**, or pick a subset?
2. OK to add the foreign keys with `NOT VALID → VALIDATE` pattern (Phase 5)? This is the highest-impact backend change but is non-destructive.
