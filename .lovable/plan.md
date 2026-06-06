# Plan: Safety, Reporting, Moderation, Recruiter Opt-in

Four independent additions. Each is small enough to ship in one migration + a focused set of UI edits.

---

## 1. Onboarding consent screen (hard gate)

**DB**
- Add to `profiles`:
  - `consent_acknowledged boolean not null default false`
  - `consent_acknowledged_at timestamptz`

**Frontend**
- New step in `StudentOnboarding.tsx` as the **final** step (after enrollment verify + college auto-fill).
- Full-screen layout (not a Dialog): heading, the exact disclosure copy, single required checkbox, "Enter CampusOS" button disabled until checked.
- On submit: update `profiles` with `consent_acknowledged = true`, `consent_acknowledged_at = now()`, then route to `/campus`.
- **Global guard**: in `AuthContext` (or a `ConsentGuard` wrapper around protected routes), after loading the session+profile, if `consent_acknowledged !== true` and the user is not already on `/onboarding`, redirect to `/onboarding` at the consent step. Applies to every route except `/auth`, `/onboarding`, `/banned`.

---

## 2. Universal report flow

**DB** — new `reports` table:
- `reporter_id uuid` (auth.uid)
- `reported_user_id uuid`
- `content_type text` check in (`'post'`,`'message'`,`'listing'`)
- `content_id uuid`
- `reason text` check in (`'harassment'`,`'inappropriate'`,`'misinformation'`,`'scam'`,`'other'`)
- `details text` (optional free text)
- `status text` default `'pending'` check in (`'pending'`,`'reviewed'`,`'actioned'`,`'dismissed'`)
- `created_at`, `reviewed_at`, `reviewed_by`
- RLS: authenticated can INSERT their own report; SELECT only by self or `has_role(uid,'admin')`; UPDATE only admin.
- GRANTs to `authenticated` and `service_role`.

**Frontend**
- New shared `<ReportSheet />` component (bottom sheet) — props: `contentType`, `contentId`, `reportedUserId`. 5 chips + textarea + submit.
- Wire-up:
  - **Posts** (`HomeScreen`, community post cards, `interview_experiences` cards): add three-dot menu → "Report this post".
  - **Marketplace listings** (`MarketplaceScreen` cards + detail): same three-dot menu → "Report this listing".
  - **Messages** (`MessagesScreen` chat bubbles + community chat bubbles): long-press handler (touch) / right-click (desktop) → "Report message".
- Toast on success. Disable submit while pending. Block duplicate reports per `(reporter_id, content_type, content_id)` via unique index.

**Admin view** (lightweight, this pass)
- New route `/admin/reports` gated by `has_role(uid,'admin')`.
- Table of pending reports with reporter, reported user, content type, reason, timestamp, and a "View content" link that deep-links to the post/listing/message context. Status change buttons: Dismiss / Mark actioned.

---

## 3. Community moderator tools

**DB**
- Add `moderator_id uuid` to `communities` (nullable for legacy rows; backfill with `created_by`).
- Keep existing `community_moderators` table as additional mods; `moderator_id` is the **primary** moderator (transferable).
- RPCs (SECURITY DEFINER, search_path = public):
  - `delete_community_post(_post_id uuid)` — verifies `auth.uid()` is primary `moderator_id` or in `community_moderators` for that community, then deletes the post.
  - `remove_community_member(_community_id uuid, _user_id uuid)` — same check, removes the `community_members` row. Cannot remove the primary moderator.
  - `transfer_community_moderator(_community_id uuid, _new_mod uuid)` — only callable by current `moderator_id`; new mod must be a member.
- Trigger `on_community_created`: when a row is inserted into `communities`, also insert a pinned post into `posts` with `community_id`, `pinned = true` (add `pinned boolean default false` to `posts`), title "Community Rules", default body template. Author = `created_by`.

**Frontend**
- `CommunityDetail` view:
  - Pinned Rules card at the top (visible to everyone). Edit button shown only to moderator → opens editor that updates the post body.
  - On each post card (when viewer is moderator): "Remove post" action in the three-dot menu → calls `delete_community_post`.
  - In members list (when viewer is moderator): "Remove member" action → calls `remove_community_member` with confirm dialog.
  - Settings tab (moderator only): "Transfer moderator" picker (members list) → `transfer_community_moderator`.

---

## 4. Recruiter opt-in toggle

**DB**
- Add `recruiter_visible boolean not null default false` to `profiles`.

**Frontend**
- `/me` Settings → new "Visibility" section with a `<Switch>` "Visible to recruiters" (off by default).
  - On enable: show explainer card with the exact copy from the brief and a Confirm button before persisting.
  - Toggle is reversible; immediate write.
- Recruiter dashboard (`/recruiter/*` candidate queries): add `.eq('recruiter_visible', true)` to every list/search query. Single profile pages accessed via direct URL also gated — if `recruiter_visible = false`, show empty state.

---

## Files touched

**Migrations (4, in order)**
1. `profiles.consent_acknowledged` + `consent_acknowledged_at`
2. `reports` table + RLS + unique index
3. `communities.moderator_id` + `posts.pinned` + RPCs + trigger + backfill
4. `profiles.recruiter_visible`

**New components/routes**
- `ConsentStep.tsx` (in onboarding)
- `ConsentGuard` in `AuthContext`/router
- `ReportSheet.tsx`, `useReport.ts`
- `AdminReportsScreen.tsx` + route `/admin/reports`
- `CommunityRulesCard.tsx`, `ModeratorActionsMenu.tsx`, `TransferModeratorDialog.tsx`
- `RecruiterVisibilityToggle.tsx`

**Edited**
- `StudentOnboarding.tsx`, `AuthContext.tsx`, `App.tsx` (routes)
- `HomeScreen.tsx`, `MarketplaceScreen.tsx`, `MessagesScreen.tsx`, community chat + community detail screens, `InterviewFeed` card
- `MyProfile` / `/me` settings
- Recruiter dashboard query files

## Out of scope
- AI auto-moderation of reports (admin reviews manually)
- Email/push notifications to moderators on report submission
- Recruiter verification flow (assumed handled elsewhere)
- Appeals workflow for removed members/posts
