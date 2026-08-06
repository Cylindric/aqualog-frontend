## Context

`/api/v1/me` (backend) now returns a `groups: string[]` field alongside the existing profile fields. The frontend's `UserProfile` type (`src/api/profile.ts`) and its runtime shape validator (`isUserProfile`) don't know about it yet, and nothing in the app derives admin status from group membership. The only consumer in scope for this change is `Shell.tsx`'s `AuthStatusBadge`, which already renders the user's identity next to a sign-out control in the top bar.

## Goals / Non-Goals

**Goals:**
- Parse and expose `groups` from `/api/v1/me` on `UserProfile`.
- Derive "is this user an AquaLog admin" (membership in `AquaLogAdmins`) from that data.
- Show a small crown icon next to the identity badge in the top bar for admin users only.
- Stay backward-compatible with API responses that omit `groups` (treat as empty/non-admin, not a parse failure).

**Non-Goals:**
- Any admin-only UI, route, or permission gating beyond the crown icon. The proposal explicitly limits scope to a visual indicator.
- A generic roles/permissions abstraction. `isAquaLogAdmin` is a single derived boolean for now; broader group-based authorization is a future change if/when admin UI actually exists.
- Persisting or caching group membership independently of the existing profile fetch/cache lifecycle (`useProfile`).

## Decisions

- **Where the admin check lives**: derive `isAquaLogAdmin` as a plain function (`isAquaLogAdmin(profile: UserProfile): boolean`) exported from `src/api/profile.ts`, next to the type it operates on, rather than adding a stateful hook. It's a pure, synchronous derivation from data `useProfile` already loads — no reason to introduce new hook/state machinery for it. Callers (`Shell.tsx`) call it directly on `profile`.
- **Group name matching**: exact, case-sensitive match against the literal `'AquaLogAdmins'`. No normalization/case-folding — the backend is the source of truth for the group's canonical name, and inventing tolerance here would silently hide a real naming mismatch instead of surfacing it.
- **Tolerant parsing over strict rejection**: `isUserProfile`'s runtime validator treats `groups` as optional in the raw response — if present it must be `string[]`, if absent the field defaults to `[]` rather than failing validation. This matches the proposal's stated resilience requirement (don't break on older/mismatched API responses) and mirrors how other optional-ish fields in this codebase degrade gracefully rather than hard-failing the whole profile fetch.
- **Icon implementation**: use Mantine's recommended icon library, [Phosphor Icons](https://mantine.dev/guides/icons/) (`@phosphor-icons/react`, `CrownIcon`), added as a new dependency, rather than hand-rolling another inline SVG. The codebase's existing icons in `src/components/primaryNav.tsx` predate this guidance and aren't touched by this change — but a new icon dependency being introduced should follow the Mantine-documented path (per-icon named imports, tree-shakable) rather than extend the ad hoc SVG pattern further.
- **Icon placement**: co-located in `src/components/Shell.tsx` next to `AuthStatusBadge` (not added to `primaryNav.tsx`, which is specifically nav-item icons) since it's a one-off badge decoration, not a nav icon.
- **Bundle chunking**: no new `vite.config.ts` manual chunk for `@phosphor-icons/react`. A single tree-shaken named import (`CrownIcon`) pulls in one icon's module, not the full library — negligible bundle weight, unlike the existing chart/mantine/auth vendor groups this project chunks separately. Revisit if more icons get added later and the dependency grows enough to matter.

## Risks / Trade-offs

- [Backend/frontend group-name drift — if the backend ever renames `AquaLogAdmins`, the frontend check silently stops matching (no error, admins just stop seeing the crown)] → Accepted for this small a change; a shared constants file would be over-engineering for one string used in one place. Worth revisiting if a second group-gated feature appears.
- [Existing tests/mocks for `/api/v1/me` and `useProfile` don't include `groups`] → Covered by the tolerant-parsing decision above; no existing test should break. New tests added for the admin-present/absent cases.

## Open Questions

None — scope is deliberately minimal per the proposal.
