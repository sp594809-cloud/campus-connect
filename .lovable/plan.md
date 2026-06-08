# Plan: Privacy & Safety hub at `/me`

Mount the already-built but unreachable components (`PrivacySettings`, `RecruiterVisibilityToggle`, `CodeOfConductDialog`) into a real Settings screen the avatar in the top bar already routes to.

## What gets built

### 1. `/me` route → `MyProfile.tsx` (new page)
Tabbed/sectioned profile + settings screen. Tabs: **Profile · Privacy & Safety · Reports · Account**.

- Wire `CampusApp.tsx` avatar button (already navigates to `/me`) to this new page.
- Add route in `frontend/src/App.tsx`.

### 2. Privacy & Safety section
Stacks four cards:

1. **Recruiter visibility** — render existing `<RecruiterVisibilityToggle />`. Includes the opt-in explainer + immediate toggle.
2. **Privacy controls** — render existing `<PrivacySettings />` (profile visibility, who can DM, profile-view tracking).
3. **Blocked users** — new small component `BlockedUsersList.tsx`:
   - Reads `user_blocks` where `blocker_id = auth.uid()` joined to `profiles` (name, avatar).
   - Each row has an **Unblock** button (deletes the `user_blocks` row).
   - Empty state: "You haven't blocked anyone."
4. **Community Code of Conduct** — button that opens the existing `<CodeOfConductDialog />` in read-only mode.

### 3. Reports section
New small component `MyReportsList.tsx`:
- Lists rows from `reports` where `reporter_id = auth.uid()`, newest first.
- Shows content type, reason, status badge (pending / reviewed / actioned / dismissed), timestamp.
- Empty state: "No reports filed."

### 4. Account section
- Sign out button (existing `AuthContext.signOut`).
- Link back to onboarding consent text (read-only).

### 5. Secondary entry points
- **Chat header** (`MessagesScreen` 1-1 view): add small shield icon → `navigate('/me?tab=safety')`.
- `MyProfile` reads `?tab=` query param to auto-select tab.

## Files

**New**
- `frontend/src/pages/MyProfile.tsx`
- `frontend/src/components/safety/BlockedUsersList.tsx`
- `frontend/src/components/safety/MyReportsList.tsx`

**Edited**
- `frontend/src/App.tsx` — add `/me` route
- `frontend/src/components/campus/screens/MessagesScreen.tsx` — add shield icon link in 1-1 chat header

## Out of scope
- No DB schema changes (all tables already exist: `user_blocks`, `reports`, `profiles.recruiter_visible`, etc.)
- No new RLS policies needed
- No admin tooling changes (admin reports view already at `/admin/reports`)
