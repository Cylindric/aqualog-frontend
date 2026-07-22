## Why

The measurements workflow currently supports salinity only and cannot remove accidental entries, which limits data quality and trend usefulness as water chemistry tracking expands. With phosphate now available in the API, the UI needs to support multi-parameter entry and visualization in a consistent shared flow.

## What Changes

- Extend measurement entry to include phosphate alongside salinity, with shared aquarium selection and shared measured-at input across all entered parameters.
- Add a phosphate trend chart on the measurements page with an optimal reference line at 0.075 ppm and value-dependent coloring.
- Add delete actions in measurement history tables to remove existing entries.
- Update measurement listing and mutation behavior to support both salinity and phosphate records in page-level presentation.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- aquarium-measurement-tracking: Expand measurement capture, trend visualization, and history management requirements to include phosphate and deletion actions.

## Impact

- Affected code: measurements API client usage, measurements page form and chart UI, table rendering, and related tests.
- Affected APIs: integration with existing measurement list/create flows plus delete mutation handling for measurement entries.
- Dependencies: frontend chart behavior and parameter-specific thresholds for phosphate trend rendering.
