## Context

The measurements experience currently focuses on salinity-only workflows and treats entry/history as a single-parameter surface. The API now supports phosphate, which introduces multi-parameter entry and trend visualization requirements while preserving the same aquarium and measurement timestamp context. In addition, operators need correction controls to remove bad entries directly from history tables.

This change touches multiple layers:
- Measurement form composition and validation logic
- Measurement API integration for create/list/delete behavior
- Trend visualization and parameter-specific reference/gradient rules
- History table structure and row-level destructive actions

## Goals / Non-Goals

**Goals:**
- Support entry of phosphate measurements in the same workflow as salinity.
- Present aquarium selection and measured-at fields once and share them across submitted parameters.
- Add phosphate trend visualization with explicit optimal and color-threshold behavior.
- Add delete actions to measurement table rows for correction workflows.

**Non-Goals:**
- Redesigning the full page layout outside measurement form/chart/table updates.
- Adding new chemistry parameters beyond phosphate in this change.
- Changing backend data contracts outside consuming available phosphate and delete support.

## Decisions

1. Use a shared measurement context for aquarium and timestamp
- Decision: Keep one aquarium selector and one measured-at field that apply to all submitted parameters in the form.
- Rationale: Prevents inconsistent timestamps per parameter in a single user action and reduces repeated inputs.
- Alternatives considered:
  - Separate forms per parameter: rejected due to duplicated controls and weaker data-entry ergonomics.
  - Parameter tabs with independent timestamp: rejected because it complicates cross-parameter capture workflows.

2. Model salinity and phosphate as parallel optional inputs in one submission flow
- Decision: Allow users to enter one or both parameter values and submit whichever is present, sharing the same context fields.
- Rationale: Matches practical testing workflows where users often capture multiple values at once but may occasionally provide only one.
- Alternatives considered:
  - Require both values always: rejected because it blocks partial-entry workflows.
  - Separate submit actions per parameter: rejected due to extra interaction cost.

3. Render independent trend cards for salinity and phosphate
- Decision: Keep salinity chart behavior and add a phosphate chart with parameter-specific thresholds.
- Rationale: Preserves readability and avoids overloading a single chart with mixed units/scales.
- Alternatives considered:
  - Combined multi-axis chart: rejected due to visual complexity for this iteration.

4. Encode phosphate chart thresholds declaratively
- Decision: Add an optimal reference line at 0.075 ppm and a gradient that is green from 0.00 to 0.10, fading to red by 0.20 and remaining red above.
- Rationale: Makes desired range immediately legible while emphasizing high-risk out-of-range values.
- Alternatives considered:
  - Neutral monochrome trend: rejected because it does not communicate target adherence.

5. Provide row-level delete actions with recoverable error feedback
- Decision: Add delete buttons in measurement history rows with optimistic UX guarded by retryable error handling.
- Rationale: Users need immediate correction controls for accidental entries without external tooling.
- Alternatives considered:
  - Bulk-delete only: rejected as too heavy for common single-row mistakes.

## Risks / Trade-offs

- [Risk] Shared submit flow could trigger partial-success conditions when one parameter mutation fails.
  - Mitigation: surface clear per-parameter feedback and refresh history after successful mutations.

- [Risk] Added delete actions increase accidental destructive interaction potential.
  - Mitigation: require explicit row action and provide immediate visible state update plus retry messaging on failure.

- [Trade-off] Two trend charts increase vertical page length.
  - Mitigation: keep cards compact and retain responsive spacing for mobile usability.

## Migration Plan

1. Extend measurements API client usage to include phosphate create/list/delete pathways.
2. Update measurements page form state/validation to support shared context with salinity and phosphate inputs.
3. Add phosphate trend chart with required optimal line and gradient thresholds.
4. Add delete actions to measurement tables and wire error/retry handling.
5. Update and run page/component/API tests to cover new parameter and deletion behavior.

## Open Questions

None.
