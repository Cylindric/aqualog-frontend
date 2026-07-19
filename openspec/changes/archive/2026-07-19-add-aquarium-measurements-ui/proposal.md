## Why

AquaLog users can currently manage aquariums and run salinity calculations, but they cannot persist salinity measurements over time in the portal UI. With new `aquarium-measurements` API endpoints now available, adding measurement entry and history visualization enables real aquarium monitoring workflows and makes trend data actionable.

## What Changes

- Add a dedicated UI section for aquarium measurements where users can submit new salinity measurements linked to an aquarium.
- Retrieve and list existing measurements from the new `aquarium-measurements` endpoints.
- Visualize salinity measurement history in the UI so users can quickly understand trends over time.
- Add loading, empty, and error states for measurement data interactions.
- Add tests for API integration and UI behavior for add/list/visualization flows.

## Capabilities

### New Capabilities
- `aquarium-measurement-tracking`: Add and display salinity measurements using the `aquarium-measurements` API, including historical visualization.

### Modified Capabilities
- `aquarium-management-workflows`: Extend aquarium management workflows to include salinity measurement capture and history review within the portal.

## Impact

- Affected frontend code in API client modules, measurement-focused UI components/pages, and routing/navigation where the new section is exposed.
- New or updated OpenSpec delta specs for `aquarium-management-workflows` plus a new capability spec for measurement tracking.
- Test updates in API and UI test suites to cover measurement create/list and visualization behavior.
- No backend implementation in this repo; frontend behavior depends on the existing API contract at `http://localhost:8001/api/v1/openapi.json`.
