## Goal
Tighten privacy on profiles and harden community safety with moderation, a code of conduct, and zero-tolerance hate-speech enforcement.

---

## 1. Private profiles by default + Discover opt-in

**Schema (profiles)**
- Add `discoverable boolean not null default false` — controls visibility in Discover/search.
- Add `profile_visibility text not null default 'connections'` with values `public | connections | private` for who can view the full profile page.
- Backfill existing rows to `discoverable = false`, `profile_visibility = 'connections'`.

**RLS**
- Replace `profiles_select_authenticated` (currently allows all authenticated reads) with:
  - Self always allowed.
  - `public` → any authenticated user.
  - `connections` → only accepted connections (use existing `are_connected`).
  - `private` → self only.
- Create a `profiles_public` view (security_invoker) exposing only safe columns (`id, name, avatar_url, branch, year, bio, interests, skills, open_to_mentor, placement_status, company`) for listing surfaces — Discover queries hit this view filtered by `discoverable = true`.

**UI**
- New "Privacy" section in Profile/Settings: toggles for *Appear in Discover*, *Profile visibility* (radio), with plain-language descriptions.
- Onboarding: add a privacy step showing both defaults are private; explicit opt-in checkbox for Discover.
- Discover screen: filter query by `discoverable = true`; show empty-state copy explaining opt-in.

---

## 2. "Who viewed my profile" log

**Schema**
- `profile_views(id, viewer_id uuid, viewed_id uuid, viewed_at timestamptz, source text)` with unique partial index on `(viewer_id, viewed_id, date_trunc('hour', viewed_at))` to dedupe.
- RLS: viewed user can SELECT their own row; viewer can INSERT only with `auth.uid() = viewer_id`; no UPDATE/DELETE for users.
- Trigger or RPC `log_profile_view(_viewed uuid)` (SECURITY DEFINER) called from the profile page; skips self-views and respects an "incognito" toggle.

**Profile additions**
- `views_incognito boolean default false` — when true, the viewer doesn't get logged (but they also can't see who viewed them — symmetric, LinkedIn-style).

**UI**
- New "Profile Views" panel on `/me` (and a card on Passport): list of recent viewers with avatar, name, branch, year, time. Empty state + 7/30-day toggle.
- Call `log_profile_view` from `UserProfile.tsx`/`StudentProfile.tsx` on mount.

---

## 3. Discover filter changes

- Remove **Branch** and **Year** controls from `DiscoverScreen.tsx` filter UI and from the query.
- Keep only interest-based search (chips + free-text on `interests`/`skills`).
- Update copy: "Find people by what they're into."
- Keep branch/year in profile cards (for users who opted into discovery), but not as filters.

---

## 4. Community moderators

**Schema**
- `community_moderators(community_id, user_id, role text check (role in ('mod','faculty')), assigned_by, assigned_at)` PK `(community_id, user_id)`.
- Migration step: for every existing community, insert its `created_by` as the initial `mod` (so no community is unmoderated).
- New community creation: require selecting at least one moderator (creator auto-added; can add others).

**Helpers + RLS**
- `is_community_moderator(_cid, _uid)` SECURITY DEFINER.
- Posts/messages in a community: moderators can UPDATE (hide) and DELETE any row in their community.

**UI**
- Community detail: "Moderators" section with avatars + faculty badge.
- Moderator console (visible only to mods): pending queue, reported items, ban actions.
- Community creation form: required "Add moderator" step.

---

## 5. Pre-publish moderation pipeline (keyword + ML)

**Schema**
- Add `moderation_status text not null default 'pending'` (`pending | approved | rejected | shadow`) and `moderation_reason text`, `moderated_at` to `posts` and `community_messages`.
- `moderation_events(id, target_table, target_id, decision, model, score, matched_terms text[], created_at)` for audit.
- `banned_terms(term text primary key, category text, severity text)` seeded with hate-speech list (categories: hate, slur, harassment, threat, sexual_minor).
- RLS on read paths: only return rows where `moderation_status = 'approved'` OR `author_id = auth.uid()` OR `is_community_moderator(...)`.

**Edge function `moderate-content`**
1. Lowercase + normalize text; check against `banned_terms`.
   - Any `severity = 'zero_tolerance'` match → `rejected` + trigger ban flow (see §6).
2. Call Lovable AI (`google/gemini-3.5-flash`) with a strict classification prompt returning JSON `{hate, harassment, sexual, violence, self_harm, spam}` scores 0–1.
   - High score on hate/harassment → `rejected`.
   - Medium → `shadow` (visible to author only) + flag for mod review.
   - Else → `approved`.
3. Write `moderation_events` row.

**Flow**
- Client posts → row inserted with `moderation_status = 'pending'` → trigger calls function asynchronously (or client invokes function then inserts approved row).
- Feed queries already filter by status; rejected items surface in user's "Removed posts" view with reason.

---

## 6. Code of Conduct + zero-tolerance bans

**Schema**
- `community_code_of_conduct(community_id pk, content_md text, version int, updated_at)` — default seeded with global CoC; communities can extend.
- `community_coc_acceptances(community_id, user_id, version, accepted_at)` PK `(community_id, user_id)`.
- `user_bans(id, user_id, scope text ('global'|'community'), community_id nullable, reason, evidence_ref, banned_by, banned_at, permanent bool default true)`.
- `has_active_ban(_uid, _cid)` helper used in INSERT policies for posts, messages, community_members, community_messages.

**Join flow**
- `community_members` INSERT policy: requires a matching row in `community_coc_acceptances` for the current version and no active ban.
- UI: joining a community opens a modal with the CoC markdown, scroll-to-bottom + explicit "I agree" checkbox before the join button enables. Re-prompt when version bumps.

**Zero-tolerance enforcement**
- When `moderate-content` flags `severity = 'zero_tolerance'`:
  - Insert `user_bans` row with `scope = 'global'`, `permanent = true`.
  - Revoke all `community_members` rows for that user.
  - Sign the user out of active sessions (via admin API in edge function) and block re-auth via a check on session refresh / app load (redirect to `/banned` page explaining the decision and appeal contact).
  - Notify moderators of the affected community.

---

## Technical details

**Files to add**
- `supabase/functions/moderate-content/index.ts`
- `frontend/src/components/privacy/PrivacySettings.tsx`
- `frontend/src/components/profile/ProfileViewsPanel.tsx`
- `frontend/src/components/community/CodeOfConductDialog.tsx`
- `frontend/src/components/community/ModeratorConsole.tsx`
- `frontend/src/pages/Banned.tsx`
- `frontend/src/hooks/useModeration.ts`
- `frontend/src/lib/moderation.ts` (client helper that invokes the edge function before insert)

**Files to edit**
- `frontend/src/components/campus/screens/DiscoverScreen.tsx` — remove branch/year filters, query `profiles_public` with `discoverable = true`.
- `frontend/src/components/campus/screens/CommunitiesScreen.tsx` — CoC modal on join, moderator badges.
- `frontend/src/components/campus/screens/HomeScreen.tsx` + post composer — wire moderation pipeline.
- `frontend/src/pages/UserProfile.tsx`, `StudentProfile.tsx` — call `log_profile_view`, respect visibility.
- `frontend/src/pages/StudentOnboarding.tsx` — privacy step.
- `frontend/src/contexts/AuthContext.tsx` — check `has_active_ban` on load → redirect to `/banned`.
- `frontend/src/App.tsx` — `/banned` route.

**Migrations (one per concern, in order)**
1. profile privacy columns + RLS rewrite + `profiles_public` view.
2. `profile_views` table + `log_profile_view` RPC.
3. `community_moderators` + helper + backfill creators.
4. moderation columns on `posts`/`community_messages` + `moderation_events` + `banned_terms` seed.
5. CoC tables + `user_bans` + `has_active_ban` helper + tightened INSERT policies.

**Defaults that protect existing users**
- All current profiles become non-discoverable; an in-app banner invites them to opt back in.
- All existing community members get auto-acceptance of the v1 CoC on first login so they aren't kicked out, but new joins require explicit accept.

---

## Out of scope (call out, don't build)
- Faculty identity verification (manual for now; faculty flag set by admin).
- Appeals workflow UI (email contact only on `/banned` page initially).
- Image/file moderation (text-only this pass).
