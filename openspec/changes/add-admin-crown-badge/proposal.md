## Why

The backend's `/api/v1/me` response now includes a `groups` key listing the authenticated user's group memberships. The frontend has no way to recognize admin users today, which blocks any future admin-only UI. This change adds minimal recognition — a small visual indicator — as the first step; broader admin-gated UI changes are explicitly out of scope for now.

## What Changes

- `UserProfile` (parsed from `/api/v1/me`) gains a `groups: string[]` field.
- A derived `isAquaLogAdmin` check (membership in the `AquaLogAdmins` group) becomes available wherever profile data is consumed.
- The Shell's top bar identity badge (`AuthStatusBadge` in `src/components/Shell.tsx`) renders a small crown icon next to the user's name when they are an AquaLog admin. No other UI changes.
- Unknown/missing `groups` in the API response is treated as "no groups" (non-admin), not an error — keeps the profile parser resilient to older API responses.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `user-profile-management`: profile data now includes group memberships, and an admin-membership check is derived from them.
- `portal-shell-and-navigation`: the shell's identity badge SHALL display an admin indicator for users in the `AquaLogAdmins` group.

## Impact

- `src/api/profile.ts`: extend `UserProfile` type and response validation (`isUserProfile`) with `groups`.
- `src/features/profile/useProfile.ts`: no interface change expected (already exposes `profile` object as-is).
- `src/components/Shell.tsx`: `AuthStatusBadge` renders the crown icon conditionally.
- New dependency: `@phosphor-icons/react` (Mantine's recommended icon library), used for the `CrownIcon`.
- Existing profile tests/mocks (`src/test/**`) that stub `/api/v1/me` responses need a `groups` field added or the parser must tolerate its absence.
