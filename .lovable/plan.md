## What's already there (good news)

The review PDF says "no reports/bans/roles exist." That's outdated — the DB and most of the wiring are already in place:

- Tables: `reports`, `user_bans`, `user_roles`, `user_blocks`, `banned_terms`, `moderation_events`, `community_moderators`
- Frontend: `ReportSheet` wired into Feed, Messages, Communities, Marketplace; `BlockedUsersList`, `MyReportsList`, `/banned` page
- Edge function: `moderate-content` (pre-publish banned-term check, returns approved/rejected/shadow)
- RPCs: `has_role`, `has_active_ban`, `is_blocked_pair`, community moderator helpers

What's missing is the **enforcement + admin workflow** on top of these tables.

## Phase 2 scope — what to actually build

### 1. Admin Review Queue (new page `/admin/moderation`)
- Gated by `has_role(auth.uid(), 'admin')` and `has_role(..., 'moderator')`
- Tabs: **Open reports**, **Auto-hidden content**, **Active bans**, **Banned terms**
- Each report row: reported content preview, reporter, reason, count of duplicate reports on same target, action buttons:
  - Dismiss (mark `reports.status = 'dismissed'`)
  - Remove content (soft-delete post/message/listing, mark report `actioned`)
  - Ban user (1 day / 7 days / 30 days / permanent, global or per-community)
- Community moderators see only reports tied to communities they moderate; admins see everything.

### 2. Auto-hide threshold
- New column `posts.hidden_at`, `community_messages.hidden_at`, `marketplace_listings.hidden_at` (nullable timestamp)
- DB trigger on `reports` insert: when ≥ 3 **distinct** reporters have flagged the same `target_table`+`target_id`, set `hidden_at = now()` on that row and write a `moderation_events` row.
- RLS / client queries updated to exclude `hidden_at is not null` for non-moderators; moderators still see them with a "hidden — under review" badge.
- Admin action "Restore" clears `hidden_at`; "Remove" hard-deletes.

### 3. Ban enforcement
- A top-level `useBanGuard()` hook in `CampusApp.tsx` that runs `has_active_ban(auth.uid())` on mount and on auth change. If banned → redirect to `/banned` (page already exists) and block all writes.
- Edge function `moderate-content` already returns `banned: true` when the user is banned; the client currently ignores it — wire it to also redirect.
- Server-side defence: add RLS check `NOT public.has_active_ban(auth.uid())` to INSERT policies on `posts`, `community_messages`, `messages`, `marketplace_listings`, `post_comments`.

### 4. Role assignment
- Tiny **Admin → Roles** tab in the moderation page: search a user by name/enrollment, grant/revoke `admin` or `moderator`.
- Seed mechanism: a one-time SQL migration that grants the `admin` role to the user_id you provide (we'll ask for the enrollment number or email when running the migration).
- Community moderators continue to use the existing `community_moderators` table; no change.

### 5. Reporter feedback
- When a report is dismissed or actioned, write the outcome onto `reports.resolution_note`. `MyReportsList` already reads `status`; extend it to show the outcome string and timestamp.

## Cuts (per your "remove the code entirely" answer)

Hard-delete the following from the frontend; keep DB tables only if other modules read them.

| Area | Files / routes to delete | DB tables |
|---|---|---|
| Recruiter dashboard | `src/pages/RecruiterDashboard.tsx`, `src/pages/RecruiterStudentDetail.tsx`, routes in `App.tsx`, recruiter buttons in nav | `recruiter_notes`, `recruiter_saved_candidates` dropped via migration |
| Public passport | `src/pages/Passport.tsx`, route in `App.tsx`, "View Public Passport" buttons in `StudentProfile.tsx` | Profile columns `passport_*` left in place (cheap, may revisit) |
| Connection requests | Connection-request UI in `UserProfile.tsx` / `StudentProfile.tsx`, badge in nav | `connection_requests` table dropped; `are_connected()` function dropped; any policy depending on it loosened to a simpler rule |
| Recruiter visibility toggle | The `recruiter_opt_in` switch added recently in `StudentProfile.tsx` | column kept (harmless), UI removed |

Before each delete I will grep for usages and patch the call sites so the build stays green.

## Out of scope (next phases per the review doc)

- Twilio OTP fix (Phase 1) — not touching this turn since you picked Phase 2.
- ExamSprint video extension (Phase 3) — separate plan once moderation lands.
- Re-scoping Communities into subject channels (Phase 5).

## Technical details

### Migration outline (one migration)
```text
1. ALTER TABLE posts / community_messages / marketplace_listings
   ADD COLUMN hidden_at timestamptz, hidden_reason text.
2. CREATE FUNCTION auto_hide_on_reports() — counts distinct reporters,
   sets hidden_at when >= 3.
3. CREATE TRIGGER after_insert_report on reports.
4. ALTER POLICY on each insertable table to add
   NOT public.has_active_ban(auth.uid()) to WITH CHECK.
5. DROP TABLE recruiter_notes, recruiter_saved_candidates,
   connection_requests; DROP FUNCTION are_connected.
6. (Optional) Grant 'admin' role to a specified user_id.
```

### Route additions
- `/admin/moderation` — guarded by `has_role('admin') OR has_role('moderator')`, else 404.

### Files to add
- `frontend/src/pages/AdminModeration.tsx`
- `frontend/src/components/admin/ReportQueue.tsx`
- `frontend/src/components/admin/BanDialog.tsx`
- `frontend/src/components/admin/RolesPanel.tsx`
- `frontend/src/hooks/useBanGuard.ts`

### Files to remove
- `frontend/src/pages/RecruiterDashboard.tsx`
- `frontend/src/pages/RecruiterStudentDetail.tsx`
- `frontend/src/pages/Passport.tsx`
- Connection-request UI blocks inside `UserProfile.tsx`, `StudentProfile.tsx`, nav components

## Open question before I build

Who should get the first **admin** role? Give me either an enrollment ID or the email you sign in with, and I'll include the role-grant in the migration so you can open `/admin/moderation` immediately after it runs. If you'd rather not decide now, I'll ship the migration without a seed and you can grant yourself the role from the SQL editor later.
