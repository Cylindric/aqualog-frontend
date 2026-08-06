## Context

`src/pages/AquariumsPage.tsx`, `AquariumDetailPage.tsx`, and `MeasurementsPage.tsx` each combine multiple independent async resources (aquarium list/detail, parameter catalog, measurement history, thresholds), their mutations (create/update/delete/submit), client-side validation, API-error mapping, and the full Mantine render tree in one file. `src/features/salinity/` and `src/features/profile/` already establish the target pattern (component + `use*` hook), and `frontend/CLAUDE.md` documents it as the intended shape for non-trivial feature logic. This design covers restructuring the three pages into that shape, plus adding an ESLint baseline the project currently lacks entirely.

## Goals / Non-Goals

**Goals:**
- Pages become composition: call feature hook(s), render presentational components — no inline `fetch`/mutation/validation logic left in `src/pages/*`.
- Eliminate the concrete duplication identified in review (`AQUARIUM_TYPES`, `AquariumFormValues`, `validateForm`, `mapApiValidationErrors`, parameter-config mapping, empty-state box, `computeThresholdVisuals` living in a page file).
- Add a working `npm run lint` (TypeScript + React Hooks aware) that a developer can run today, with the codebase passing it.
- Preserve existing observable behavior and test coverage — this is a structural refactor, not a feature change.

**Non-Goals:**
- No new data-fetching library (react-query/SWR, etc.) — stays consistent with the hand-rolled hook style already used by `useProfile`/`useSalinityCalculator`/`useReadinessCheck`.
- No CI wiring for lint (no GitHub Actions changes) — local capability only, per the proposal.
- No type-aware (`recommendedTypeChecked`) ESLint rules in this change — see Open Questions.
- No relocation of the page files themselves out of `src/pages/` — routing/lazy-loading in `App.tsx` and the `pages/` vs `features/` split stay as documented in `CLAUDE.md`.

## Decisions

**1. Introduce a minimal shared `useAsync` primitive, used internally by feature hooks — not a full data-fetching library.**
Every page currently hand-rolls the same `status: 'loading'|'ready'|'error'` + error-string + retry shape 3-5 times, with inconsistent naming (`viewState` vs `aquariumsLoading`/`aquariumsError`). Add `src/hooks/useAsync.ts` exposing `{status, data, error, run, retry}` for a single in-flight async operation. Feature hooks (below) build on it rather than reimplementing the same tri-state machine.
- *Alternative considered*: adopt react-query. Rejected — the app's data needs are simple (a handful of resources, no cache-sharing/pagination requirements), and it would introduce a new paradigm inconsistent with the rest of the codebase for no proportionate benefit.
- *Alternative considered*: leave each hook to manage its own status booleans. Rejected — this is exactly the duplication being removed.

**2. Feature hook boundaries follow resource, not page.**
- `src/features/aquariums/useAquariumsList.ts` — list + create + delete, for `AquariumsPage`.
- `src/features/aquariums/useAquariumDetail.ts` — get + update, for `AquariumDetailPage`'s own-aquarium form.
- `src/features/aquariums/useAquariumThresholds.ts` — parameter catalog + per-parameter get/set threshold, for `AquariumDetailPage`'s limits table.
- `src/features/aquariums/aquariumForm.ts` — pure, framework-free: `AQUARIUM_TYPES`, `AquariumFormValues`, `validateForm`, `mapApiValidationErrors`. Used by both the create form (`AquariumsPage`) and the edit form (`AquariumDetailPage`).
- `src/features/measurements/useMeasurementParameters.ts` — parameter catalog + per-parameter thresholds (read-only, for the trend charts).
- `src/features/measurements/useMeasurementHistory.ts` — load/create/delete measurements for a selected aquarium, including the existing `Promise.allSettled` partial-failure handling per parameter.
- `src/features/measurements/measurementForm.ts` — pure: form-value shaping, `validateMeasurement`, `mapApiValidationErrors`.
- `src/features/measurements/thresholdVisuals.ts` — the existing pure `computeThresholdVisuals`, moved as-is.
- `src/features/measurements/ParameterTrendChart.tsx` / `MeasurementHistoryTable.tsx` — the existing sub-components, moved as-is (still presentational, still take data via props).
- *Alternative considered*: one large `useMeasurementsPage()` hook mirroring the page 1:1. Rejected — would just relocate the 900-line problem into a 900-line hook instead of resolving it; per-resource hooks are independently testable and some are reusable (`useAquariumsList` is needed by both `AquariumsPage` and, indirectly, `MeasurementsPage`'s aquarium selector).

**3. `src/pages/*.tsx` stays the routing/composition layer; nothing moves out of `pages/`.**
Matches the existing documented split (`CLAUDE.md`: "pages/ (route-level components)" vs "features/<feature>/ (feature-specific components + hooks)"). Only the logic and reusable sub-components move to `features/`; the page files remain the `React.lazy`-loaded route targets referenced from `App.tsx`, now just orchestrating hooks + JSX composition.

**4. ESLint: flat config, `eslint-plugin-react-hooks` (classic recommended) + `eslint-plugin-react-refresh`, TS/TSX parsed via `@babel/eslint-parser` — NOT `typescript-eslint`.**
This deviates from the original plan, discovered during implementation: this project is on `typescript@^7.0.2` (TS's native/Go-based major), and `typescript-eslint` (all published versions as of this change, tracked in [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)) hard-refuses to run against TS 7 — confirmed by actually installing it (`Error: typescript-eslint does not support TS 7.0.`). This isn't a version-pinning gap; maintainers describe it as an architecture gap (their rules need the classic JS-land AST/type-checker API that TS7's native compiler doesn't expose yet) likely "the next 1-2 major versions" out, with no offered workaround. The user chose (via options presented mid-implementation) the lowest-risk path: parse `.ts`/`.tsx` with `@babel/eslint-parser` (`@babel/preset-react` + `@babel/preset-typescript`, syntax-only, no type information) instead of `@typescript-eslint/parser`. TS type correctness is unaffected — it's still fully covered by `tsc -b` in `npm run build` (`strict`, `noUnusedLocals`, `noUnusedParameters` already on). Core `no-unused-vars` and `no-undef` are turned off for `.ts`/`.tsx` files specifically because the Babel parser has no concept of TS type positions (interfaces, generics, type-only imports) and both rules produce false positives on them; `tsc -b` already covers both concerns with full type awareness.
  - *Alternative considered*: alias the `typescript` package itself to `@typescript/typescript6` (the TS team's documented side-by-side trick) so `typescript-eslint` sees a supported version while a separately-aliased native TS7 build handles the real `tsc -b`. Rejected — adds a second TypeScript install and non-trivial build-script surgery just to satisfy a lint tool, and per the tracking issue this isn't even confirmed by `typescript-eslint` maintainers to work for their parser specifically.
  - *Alternative considered*: pin the whole project's `typescript` devDependency back to 6.x. Rejected — reverses what's clearly a deliberate recent upgrade to TS7; out of scope for an ESLint-onboarding change to force.
  - *Alternative considered*: defer the lint capability entirely until `typescript-eslint` supports TS7. Rejected by the user in favor of getting hooks/JS-level linting value now.
  - `eslint-plugin-react-hooks` is pinned to `5.2.0` rather than latest (`7.x`), also discovered during implementation: v7's `recommended` config bundles React Compiler's full rule set (`set-state-in-effect`, `purity`, `immutability`, `gating`, etc. — 16 rules total), which is a materially different, much stricter linter than "hooks correctness," and firing it flags the standard fetch-on-mount `useEffect` pattern used throughout this codebase (including inside the very pages being refactored) — the project doesn't use React Compiler. `5.2.0` is the last release with the classic two-rule `recommended` (`rules-of-hooks`, `exhaustive-deps`) that this change's spec actually asked for. Adopting the React Compiler rule set is a legitimate separate decision, not an incidental side effect of onboarding ESLint — added to Open Questions.
  - `eslint` itself is pinned to `^9.39.5` (not latest `10.x`) and `@eslint/js` matched to `^9.39.5`, purely so `npm install` resolves cleanly without `--legacy-peer-deps` — `eslint-plugin-react-hooks@5.2.0`'s peer range tops out at `^9.0.0`, and `--legacy-peer-deps` was observed to silently skip installing real peer dependencies elsewhere in the tree (it caused `@testing-library/dom` to go missing, breaking all `@testing-library/react` tests, until the eslint version was aligned and a plain `npm install` was used instead).
  - *Alternative considered*: also add `eslint-plugin-jsx-a11y`. Out of scope for this change (review didn't flag accessibility); can be proposed separately.

**5. Migration order: tooling first, then smallest page, then largest.**
1. Add ESLint config + script, fix what it flags repo-wide that's trivial (unused vars/imports, the `useReadinessCheck.ts` duplicate import). This gives the subsequent refactor steps a working safety net.
2. Extract `aquariums` feature (`useAquariumsList`, `aquariumForm.ts`, shared `EmptyState`) and refactor `AquariumsPage.tsx` — smallest of the three, validates the pattern.
3. Extract `useAquariumDetail`/`useAquariumThresholds` and refactor `AquariumDetailPage.tsx`, reusing `aquariumForm.ts`.
4. Extract the `measurements` feature (hooks, `thresholdVisuals.ts`, sub-components) and refactor `MeasurementsPage.tsx` — largest and most cross-cutting, done last once the pattern is proven twice over.
5. Update `frontend/CLAUDE.md` (lint command documented, "no ESLint config" note removed).

Each step should leave `npm run build` and `npm run test` passing before moving to the next — not a single big-bang commit.

## Risks / Trade-offs

- **[Risk]** Moving JSX into new presentational components could subtly change rendered markup/queries that existing tests rely on (`src/test/pages/*.test.tsx`, `getByTestId('...history-table')`, etc.) → **Mitigation**: preserve existing `data-testid`s and DOM structure for anything under test; run the relevant test file after each extraction step, not just at the end of the change.
- **[Risk]** `computeThresholdVisuals` has a dedicated test file that imports it from the page today (`MeasurementsPage.computeThresholdVisuals.test.ts`) → **Mitigation**: update that test's import to the new `features/measurements/thresholdVisuals.ts` path in the same step that moves the function; do not leave a re-export shim in the page file.
- **[Risk]** `useAsync` becomes a leaky abstraction if forced onto resources with genuinely different semantics (e.g. `useMeasurementHistory`'s per-parameter `Promise.allSettled` partial-failure handling doesn't fit a single-operation status hook) → **Mitigation**: keep `useAsync` minimal (one in-flight operation, one status/error), and let hooks with different failure semantics implement their own state on top of it or bypass it rather than distorting the primitive to fit every case.
- **[Risk]** Turning on ESLint for the first time surfaces pre-existing issues well beyond this change's scope (e.g. across `components/`, `auth/`, `api/`) → **Mitigation**: fix what's trivial/mechanical repo-wide (unused imports/vars — cheap, zero-risk); for anything non-trivial outside the three pages being refactored, record it in `tasks.md` as a noted-but-deferred item rather than expanding this change's diff further.
- **[Risk]** `eslint-plugin-react-hooks`'s `exhaustive-deps` may flag the `useEffect` calls to `loadX()` functions across the pages being refactored (review finding: deps arrays omit called functions) → **Mitigation**: this is expected and desired — the hook extraction in this same change naturally resolves it, since the new feature hooks return stable `useCallback`-wrapped functions with correct dependencies instead of page-local closures.

## Migration Plan

No runtime/data migration — this is a source-only refactor plus a new local dev-tooling capability. Steps are the five ordered items in Decision 5, each independently buildable/testable/committable. Rollback is a plain revert of the relevant commit(s); no deployed behavior changes, so no rollback coordination with backend or infra is needed.

## Open Questions

- Should a follow-up change adopt `typescript-eslint` once it supports TS7 ([tracking issue](https://github.com/typescript-eslint/typescript-eslint/issues/10940)), replacing the interim `@babel/eslint-parser` setup? No action needed until upstream ships support — revisit then.
- Should `eslint-plugin-react-hooks` be upgraded to `7.x` (React Compiler's rule set) in a follow-up, and if so, does the project also want to adopt React Compiler itself? These are coupled decisions; not part of this change.
- Should `eslint-plugin-jsx-a11y` be added in a follow-up given no accessibility linting exists today? Out of scope here; flagging for a future change if wanted.
