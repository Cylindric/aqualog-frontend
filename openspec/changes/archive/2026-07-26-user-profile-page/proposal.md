## Why

Users currently have no way to view or change their display name inside AquaLog — the backend already exposes `GET/PATCH /api/v1/me` with a `display_name` field, but the frontend has no page or navigation entry point that surfaces it. Users see whatever name was derived at account creation with no way to correct it.

## What Changes

- Add a new "Profile" page reachable from primary navigation that shows the signed-in user's current display name (and account metadata: username, member-since date).
- Add an edit flow on that page allowing the user to change their display name and save it via the existing `PATCH /api/v1/me` endpoint.
- Add a `src/api/profile.ts` client module (`getMyProfile`/`updateMyProfile`) following the existing `apiGet`/`apiPatch` pattern used by `aquariums.ts`/`measurements.ts`.
- Add a `/profile` route and a nav entry in `primaryNav.ts` linking to it.
- Client-side validation of display name (non-empty, within the backend's 120-character limit) with inline error messaging before submit.

## Capabilities

### New Capabilities
- `user-profile-management`: viewing the signed-in user's profile and editing their display name from within the app.

### Modified Capabilities
(none — no existing spec's requirements change; this only adds a new page and nav entry)

## Impact

- New files: `src/pages/ProfilePage.tsx`, `src/features/profile/` (component + hook), `src/api/profile.ts`, plus mirrored tests under `src/test/`.
- Modified files: `src/App.tsx` (new lazy route), `src/components/primaryNav.ts` (new nav item).
- Backend: no changes required — consumes the existing `GET /api/v1/me` and `PATCH /api/v1/me` endpoints in `backend/src/profile.py`.
