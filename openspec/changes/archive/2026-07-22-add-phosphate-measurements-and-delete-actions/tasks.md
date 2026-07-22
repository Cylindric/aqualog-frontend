## 1. API Client and Data Model Updates

- [x] 1.1 Extend measurement API client functions and types to support phosphate parameter records in list and create flows.
- [x] 1.2 Add delete measurement API integration and typed error handling for row-level removal actions.

## 2. Shared Measurement Entry Form

- [x] 2.1 Refactor measurements page form state so aquarium selection and measured-at fields are shared once for all parameter submissions.
- [x] 2.2 Add phosphate input with validation and submit logic that supports one-or-both parameter entries in a single submit action.

## 3. Trend Visualization Enhancements

- [x] 3.1 Keep salinity trend behavior and add phosphate trend chart card using phosphate-only history.
- [x] 3.2 Configure phosphate trend chart thresholds with optimal line at 0.075 ppm and gradient coloring green from 0.00 to 0.10, fading to red at 0.20 and above.

## 4. Measurement History Tables and Deletion

- [x] 4.1 Update measurement history rendering to show parameter-specific values with consistent sorting and empty-state handling.
- [x] 4.2 Add Delete button actions in measurement tables, including in-flight UI state, success refresh, and recoverable failure feedback.

## 5. Test Coverage and Validation

- [x] 5.1 Update and add unit/component tests for shared form behavior, phosphate visualization, and delete actions.
- [x] 5.2 Run relevant frontend test suites and document verification outcomes in change notes.

### Verification Notes (2026-07-22)

- Test command: `npm test -- src/test/api/measurements.test.ts src/test/pages/MeasurementsPage.test.tsx`
- Result: 2 test files passed, 14 tests passed.
