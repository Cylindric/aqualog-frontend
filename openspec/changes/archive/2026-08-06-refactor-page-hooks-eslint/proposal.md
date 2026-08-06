## Why

A code review of `src/` found that the three largest pages (`AquariumsPage.tsx`, `AquariumDetailPage.tsx`, `MeasurementsPage.tsx`, 425–917 lines each) mix data-fetching, mutation, and validation logic directly into the page component instead of following the hook+component split already established elsewhere in the codebase (`features/salinity`, `features/profile`, `hooks/useReadinessCheck`). This produces real duplication (`AQUARIUM_TYPES`, `AquariumFormValues`, `validateForm`, `mapApiValidationErrors`, parameter-config mapping, and empty-state styling are copy-pasted across pages) and makes logic like `computeThresholdVisuals` untestable except by importing a 900-line page file. Separately, the project has no ESLint configuration at all, so patterns like the stale-closure risk in `MeasurementsPage`'s effects, or a leftover duplicate import in `useReadinessCheck.ts`, have no automated guardrail. Consolidating now — before more pages are added — keeps the codebase consistent with the pattern it has already chosen for itself.

## What Changes

- Extract data-fetching, mutation, and validation logic out of `AquariumsPage.tsx`, `AquariumDetailPage.tsx`, and `MeasurementsPage.tsx` into feature hooks under `src/features/aquariums/` and `src/features/measurements/`, mirroring the existing `features/salinity` (component + `use*` hook) shape. Pages become thin composition: call the hook(s), render presentational components.
- Extract presentational sub-pieces currently defined as private functions inside the page files (`MeasurementHistoryTable`, `ParameterTrendChart`) into `src/features/measurements/` components.
- Extract the pure `computeThresholdVisuals` chart-math function out of `MeasurementsPage.tsx` into `src/features/measurements/thresholdVisuals.ts`; existing tests that import it from the page file move to import from the new module.
- De-duplicate logic currently copy-pasted between `AquariumsPage.tsx` and `AquariumDetailPage.tsx`: `AQUARIUM_TYPES`, `AquariumFormValues`, `validateForm`, `mapApiValidationErrors` move into a shared `src/features/aquariums/aquariumForm.ts`.
- De-duplicate the parameter-config mapping (`toParameterConfigs` / `toThresholdParameterConfigs`) into a single shared helper (in `src/api/parameters.ts` or a small shared module), used by both `AquariumDetailPage` and `MeasurementsPage`.
- Introduce a shared `EmptyState` component to replace the three duplicated dashed-box `<Box>` empty-state blocks.
- Add ESLint to the frontend project: `eslint-plugin-react-hooks` (pinned `5.2.0`, classic `rules-of-hooks`/`exhaustive-deps` recommended set), `eslint-plugin-react-refresh`, and `.ts`/`.tsx` parsing via `@babel/eslint-parser` (`@babel/preset-react` + `@babel/preset-typescript`) — **not** `typescript-eslint`, because this project's `typescript@^7.0.2` isn't supported by any published `typescript-eslint` release (discovered during implementation; see `design.md` Decision 4). Flat config (`eslint.config.js`) and an `npm run lint` script. No CI wiring beyond what's asked for — just the local capability. This does **not** contradict `CLAUDE.md`'s "no ESLint config, don't invent lint commands" note; this change is what adds that config, and `CLAUDE.md` should be updated once it's real.
- Fix the lint findings this configuration surfaces that are trivial/mechanical (e.g. the duplicate `toUserMessage` import in `src/hooks/useReadinessCheck.ts`, unused vars/imports). Non-trivial findings (e.g. any genuine `exhaustive-deps` issue that needs a real behavior decision, not just a dependency-array edit) are called out in tasks rather than silently "fixed" by suppressing the rule.
- Update `frontend/CLAUDE.md`'s "no ESLint config" note to document the new `npm run lint` command once it exists.
- **BREAKING**: none — this is an internal refactor plus dev-tooling addition. No public routes, API contracts, or user-visible behavior change.

## Capabilities

### New Capabilities
- `frontend-lint-tooling`: the frontend project provides an ESLint configuration (TypeScript + React Hooks rules) and an `npm run lint` script that a developer or CI can run to catch lint violations.

### Modified Capabilities
(none — this change restructures implementation, not the observable behavior of `aquarium-management-workflows`, `aquarium-measurement-tracking`, or `aquarium-parameter-thresholds`; those specs' requirements are unchanged and existing page tests must continue to pass unmodified in behavior, only relocated where they follow moved code)

## Impact

- **Code**: `src/pages/AquariumsPage.tsx`, `src/pages/AquariumDetailPage.tsx`, `src/pages/MeasurementsPage.tsx` (shrink significantly), new `src/features/aquariums/*`, new `src/features/measurements/*`, `src/hooks/useReadinessCheck.ts` (dead import removed).
- **Tests**: `src/test/pages/MeasurementsPage.computeThresholdVisuals.test.ts` moves/updates its import path; other existing page tests should keep passing against the refactored pages with minimal changes (same rendered output/behavior).
- **Dependencies**: adds `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `@babel/core`, `@babel/eslint-parser`, `@babel/preset-react`, `@babel/preset-typescript` as devDependencies (not `typescript-eslint` — see Impact/design.md note above). `eslint`/`@eslint/js` pinned to `^9.39.5` and `eslint-plugin-react-hooks` to `5.2.0` for peer-dependency and rule-set reasons, not latest.
- **Docs**: `frontend/CLAUDE.md` command list gains `npm run lint`; its "no ESLint config" note is removed once true.
- **No** backend, API, or infra impact.
