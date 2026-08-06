## 1. Profile data model

- [x] 1.1 Add `groups: string[]` to `UserProfile` in `src/api/profile.ts`.
- [x] 1.2 Update `isUserProfile` to accept an optional `groups` field on the raw response (must be `string[]` if present), and default it to `[]` when parsing into `UserProfile` if absent.
- [x] 1.3 Add `isAquaLogAdmin(profile: UserProfile): boolean` to `src/api/profile.ts`, checking for exact membership of `'AquaLogAdmins'` in `profile.groups`.
- [x] 1.4 Update `src/test/api/profile.test.ts`: add cases for a response with `groups` present (including `AquaLogAdmins`) and one with `groups` omitted, asserting the parsed `UserProfile` and `isAquaLogAdmin` result in each case.

## 2. Crown icon

- [x] 2.1 Add `@phosphor-icons/react` as a dependency (`npm install @phosphor-icons/react`), per Mantine's [recommended icon library](https://mantine.dev/guides/icons/).

## 3. Shell top bar

- [x] 3.1 Update `AuthStatusBadge` in `src/components/Shell.tsx` to import `CrownIcon` from `@phosphor-icons/react` and render it next to the identity text when `isAquaLogAdmin(profile)` is true, and omit it otherwise.
- [x] 3.2 Update `src/test/components/Shell.test.tsx`: extend the existing profile mock fixtures with `groups`, and add cases asserting the crown icon is present when the mocked profile includes `AquaLogAdmins` and absent when it doesn't (or when `groups` is omitted).

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run test`, and `npm run build`; confirm all pass clean. **Found during verification**: `npm run build` (`tsc -b`) failed because `UserProfile` mock fixtures in `src/test/features/profile/ProfileView.test.tsx` and `src/test/pages/ProfilePage.test.tsx` (both typed via `vi.mocked(getMyProfile)`/`vi.mocked(updateMyProfile)`) didn't satisfy the new required `groups` field — added `groups: []` to both. `npm run lint` clean, `npm run test` 20/20 files / 142/142 tests, `npm run build` succeeds.
