## Why

The Aquarium management page currently edits every aquarium in a right-hand `Drawer`, which leaves no room to show the richer per-aquarium detail we now want to expose. The backend already has a working `AquariumParameterThreshold` model and a `GET`/`PUT /api/v1/aquariums/{id}/thresholds/{parameter}` endpoint for `temperature`, `salinity`, and `phosphate`, but the frontend has no UI for it. Moving editing into a full-page detail view gives us the space to add min/max/target threshold inputs alongside the existing name/type/volume fields.

## What Changes

- Replace the edit `Drawer` on `AquariumsPage` with navigation to a dedicated aquarium detail page (`/aquariums/:id`) that hosts the existing name/type/volume edit form.
- "Add Aquarium" continues to use the existing modal/drawer-style quick-create flow (unchanged) since there's no existing record to navigate to yet.
- Add a new "Parameter Limits" section to the aquarium detail page with `min`, `max`, and `target` number inputs for `temperature`, `salinity`, and `phosphate`, backed by the existing `GET`/`PUT /api/v1/aquariums/{id}/thresholds/{parameter}` endpoints.
- Add a typed frontend API client module for the thresholds endpoints (`src/api/thresholds.ts`), following the existing `apiGet`/`apiPut` conventions in `src/api/client.ts`.
- Client-side validation for threshold inputs mirrors the backend's ordering rule (`min <= target <= max`) and per-parameter sanity ranges, surfacing the same validation errors the API returns.

## Capabilities

### New Capabilities
- `aquarium-parameter-thresholds`: viewing and editing per-aquarium min/max/target limits for temperature, salinity, and phosphate.

### Modified Capabilities
- `aquarium-management-workflows`: editing an existing aquarium record now navigates to a full-page detail view instead of opening a sidebar drawer.

## Impact

- Frontend only — the backend API (`src/aquarium_parameter_thresholds.py`, `src/aquarium_parameter_threshold_repository.py`) already exists and is unchanged by this proposal.
- `src/pages/AquariumsPage.tsx`: remove edit-drawer logic, add row-click/edit-button navigation to the new detail page.
- New `src/pages/AquariumDetailPage.tsx` (or similar) plus route registration in `src/App.tsx` (`/aquariums/:id`).
- New `src/api/thresholds.ts` API client module.
- `src/components/primaryNav.ts` / `Shell.tsx` unaffected — no new top-level nav entry, this is a drill-down from the existing Aquariums list.
