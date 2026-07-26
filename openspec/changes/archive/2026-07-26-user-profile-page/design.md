## Context

The backend already exposes a complete profile API (`backend/src/profile.py`): `GET /api/v1/me` returns `{id, username, display_name, bio, created_at, updated_at}`, `PATCH /api/v1/me` accepts a partial `{display_name?, bio?}` body (max 120 chars for `display_name`) and persists via `UserRepository.update_profile`. No backend work is needed. The frontend has no page consuming this endpoint and no `src/api/profile.ts` module. This change adds the page, following the existing `features/<feature>/` (component + hook) and `api/*.ts` conventions documented in `frontend/CLAUDE.md`.

## Goals / Non-Goals

**Goals:**
- Let a signed-in user see their current display name, username, and member-since date.
- Let a signed-in user edit and save their display name, with inline validation and save/error/success feedback.
- Reuse existing patterns exactly: `apiGet`/`apiPatch` from `src/api/client.ts`, `features/<name>/Component.tsx` + `useX.ts` hook split, lazy-loaded route in `App.tsx`, nav entry in `primaryNav.ts`.

**Non-Goals:**
- Editing `bio` (backend supports it, but it's not part of this request — leave the field out of the UI for now; the API module may still type it since the response includes it).
- Avatar/photo upload, email change, or any account-security settings.
- Admin-facing profile management for other users.

## Decisions

- **New page + nav item vs. modal/drawer off an existing page**: use a dedicated `/profile` route and nav entry, matching how `Aquariums`/`Measurements` are already first-class nav destinations, rather than tucking profile editing into a menu popover. Simpler to test and consistent with existing routing.
- **Single GET on mount, optimistic-free PATCH on submit**: `useProfile` hook loads the profile once via `getMyProfile()` on mount; edits are local state until "Save" triggers `updateMyProfile({display_name})`, then the hook replaces local state with the server response (source of truth for `updated_at`). No optimistic update — avoids needing rollback logic for a low-frequency, low-latency action.
- **Validation client-side mirrors backend constraint**: trim + require non-empty, max 120 chars, matching `UpdateProfileRequest.display_name` in `backend/src/profile.py`. Client validation is UX-only; the backend remains the enforcement boundary.
- **API module shape**: `src/api/profile.ts` exports `getMyProfile(): Promise<UserProfile>` and `updateMyProfile(patch: { display_name?: string }): Promise<UserProfile>`, mirroring the `apiGet`/`apiPatch` usage already in `src/api/aquariums.ts`.

## Risks / Trade-offs

- [Race between two tabs editing simultaneously] → Out of scope; last write wins via the existing PATCH semantics, no optimistic concurrency token exists on the backend today.
- [Display name shown elsewhere in the app (e.g. shell header) could go stale after edit until next full profile fetch] → Acceptable for this change since no such usage currently exists; note for future work if a header greeting is added later.
