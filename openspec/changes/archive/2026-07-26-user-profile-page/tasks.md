## 1. API client

- [x] 1.1 Add `src/api/profile.ts` with a `UserProfile` type (`id`, `username`, `display_name`, `bio`, `created_at`, `updated_at`) and `getMyProfile()` (`apiGet('/me')`) / `updateMyProfile(patch: { display_name?: string })` (`apiPatch('/me', patch)`) functions, matching the shape of `backend/src/profile.py`.
- [x] 1.2 Add unit tests for `src/api/profile.ts` under `src/test/api/profile.test.ts` covering success and error propagation, mirroring existing tests for `aquariums.ts`.

## 2. Profile feature (component + hook)

- [x] 2.1 Create `src/features/profile/useProfile.ts`: loads the profile on mount via `getMyProfile()`, exposes `{ profile, isLoading, error, refetch }` plus a `save(displayName: string)` method that calls `updateMyProfile` and updates local state from the response.
- [x] 2.2 Create `src/features/profile/ProfileView.tsx` (or similar): renders username, display name, member-since date, an edit control for display name, inline validation (non-empty, <= 120 chars, trimmed), and save/error/success feedback wired to `useProfile`.
- [x] 2.3 Add tests under `src/test/features/profile/` covering: initial load, validation errors block submit, successful save updates displayed value, failed save keeps the user's edit and shows an error.

## 3. Page and routing

- [x] 3.1 Create `src/pages/ProfilePage.tsx` that renders the profile feature component inside the page layout used by other pages (e.g. `AquariumsPage.tsx` as reference).
- [x] 3.2 Add a lazy-loaded `/profile` route in `src/App.tsx` following the existing `lazy(() => import(...))` pattern for `AquariumsPage`/`MeasurementsPage`.
- [x] 3.3 Add a `Profile` entry to `PRIMARY_NAV_ITEMS` in `src/components/primaryNav.ts` with an appropriate icon and `to: '/profile'`.
- [x] 3.4 Add/extend a test under `src/test/pages/` verifying `ProfilePage` renders and the nav includes the new entry.

## 4. Verification

- [x] 4.1 Run `npm run build` to confirm type-checking and bundling succeed.
- [x] 4.2 Run `npm run test` to confirm all new and existing tests pass.
- [x] 4.3 Manually exercise the page with `npm run dev` against a running backend: load profile, edit display name, save, confirm persistence on reload.
