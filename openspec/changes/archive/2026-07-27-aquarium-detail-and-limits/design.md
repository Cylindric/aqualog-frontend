## Context

`AquariumsPage.tsx` currently lists aquariums in a `Table` and edits the selected one in a right-hand Mantine `Drawer` (`drawerOpen`/`selectedAquarium` state, shared with the "Add Aquarium" flow). The backend already exposes a fully working threshold API — `AquariumParameterThreshold` model, `AquariumParameterThresholdRepository`, and `GET`/`PUT /api/v1/aquariums/{id}/thresholds/{parameter}` for `temperature` | `salinity` | `phosphate` (`backend/src/aquarium_parameter_thresholds.py`) — with server-side validation of per-parameter sanity ranges and `min <= target <= max` ordering. No frontend code consumes it yet, and there is no `apiPut` helper in `src/api/client.ts` (only `apiGet`/`apiPost`/`apiPatch`/`apiDelete`).

Routing today (`src/App.tsx`) has no per-record detail route — everything under `/aquariums` is the list page.

## Goals / Non-Goals

**Goals:**
- Clicking "Edit" on an aquarium row navigates to a new full-page route (`/aquariums/:id`) instead of opening the `Drawer`.
- That detail page can edit the existing name/type/volume fields (same validation as today) plus new min/max/target inputs for temperature, salinity, and phosphate, persisted via the existing threshold endpoints.
- Threshold form validation mirrors the backend: per-parameter sanity ranges and `min <= target <= max` ordering, with server validation errors surfaced if client checks are bypassed.

**Non-Goals:**
- No changes to the "Add Aquarium" flow — new aquariums are still created via the existing modal/drawer quick-create, since thresholds only make sense once an aquarium (and its id) exist.
- No backend changes — the threshold API, model, and repository are already implemented and out of scope.
- No changes to the measurements page/workflow or to how temperature/salinity/phosphate measurements themselves are recorded — this change is limits/targets only, not measurement entry.
- No bulk/multi-aquarium threshold editing.

## Decisions

**Full-page detail route (`/aquariums/:id`) rendered via `React.lazy`, matching existing page-loading convention.**
Alternative considered: keep the Drawer but make it wider / add tabs. Rejected per explicit product direction — a full page gives room for three parameters × three fields (9 inputs) plus the existing aquarium fields without cramming a sidebar.

**Detail page owns its own data fetch via a new `getAquarium(id)` call to the existing `GET /api/v1/aquariums/{aquarium_id}` endpoint, rather than lifting state from `AquariumsPage` or reusing `listAquariums()`.**
The backend already has a single-record GET (`backend/src/aquariums.py`, `@router.get("/{aquarium_id}")`); the frontend `src/api/aquariums.ts` just doesn't have a client function for it yet. Fetching the one record directly is simpler and cheaper than listing all aquariums and finding by id. A 404 from that endpoint (stale link, deleted elsewhere) drives a not-found state with a link back to `/aquariums`.

**New `src/api/thresholds.ts` module with `getThreshold`/`setThreshold`, following the `aquariums.ts`/`measurements.ts` pattern (typed `*Payload` interfaces, runtime shape guards, snake_case↔camelCase mapping).**
Keeps the API layer consistent; the response envelope (`{success, request_id, data}`) matches every other endpoint.

**Add `apiPut<T>` to `src/api/client.ts` alongside `apiGet`/`apiPost`/`apiPatch`/`apiDelete`.**
The threshold endpoint is a `PUT` (full upsert of target/min/max), not a `PATCH`; adding the verb keeps `thresholds.ts` consistent with "use `apiGet`/`apiPost`/`apiPatch`/`apiDelete`, don't call `fetch` directly" rather than introducing a one-off fetch call.

**Three independent threshold "rows" (temperature/salinity/phosphate) each with `min`/`max`/`target` `NumberInput`s, saved individually or via one "Save Limits" action that issues three `PUT` calls.**
Alternative considered: a single combined save that fails atomically. Rejected — the backend endpoint is per-parameter, so a combined save is inherently three requests; the UI should let partial success surface per-row (e.g., temperature saves fine, phosphate fails validation) rather than an all-or-nothing illusion.

**Client-side validation constants (sanity ranges, ordering rule) are duplicated in the frontend rather than fetched from the API.**
The backend has no endpoint exposing `THRESHOLD_SANITY_RANGES`. Duplicating the three numeric ranges (salinity 0–100 ppt, phosphate 0–100 ppm, temperature 0–45 °C) and the `min <= target <= max` rule as frontend constants is simple and low-risk since these are stable domain constants; server-side validation remains the source of truth and its errors are still surfaced via `mapApiValidationErrors`-style handling.

## Risks / Trade-offs

- **[Risk] Duplicated sanity-range constants can drift from backend if the backend ranges change.** → Mitigation: keep constants colocated in one exported object in `thresholds.ts` with a comment pointing at the backend module, so a future backend range change has one obvious frontend spot to update; server validation is the actual enforcement backstop regardless.
- **[Risk] Three separate PUT requests for Save Limits means partial failure states.** → Mitigation: per-row error display (not one global error banner) so the user can see exactly which parameter's limits failed to save and retry just that row.

## Open Questions

- None outstanding — the change is additive and scoped to the frontend, with the backend contract already fixed by the existing threshold API.
