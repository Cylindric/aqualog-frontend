## 1. API client

- [x] 1.1 Add `apiPut<T>(path, body, signal?)` to `src/api/client.ts`, following the existing `apiPatch`/`apiPost` pattern.
- [x] 1.2 Add `getAquarium(aquariumId, signal?)` to `src/api/aquariums.ts`, calling the existing `GET /api/v1/aquariums/{aquarium_id}` endpoint (mirroring `updateAquarium`'s response handling/shape guard).
- [x] 1.3 Create `src/api/thresholds.ts`: `ThresholdParameter` type (`'temperature' | 'salinity' | 'phosphate'`), `ThresholdRecord` interface (`aquariumId`, `parameter`, `target`, `min`, `max`, `unit`), snake_case↔camelCase payload mapping and runtime shape guards (mirroring `aquariums.ts`/`measurements.ts`), plus `getThreshold(aquariumId, parameter, signal?)` and `setThreshold(aquariumId, parameter, input, signal?)` calling `GET`/`PUT /api/v1/aquariums/{aquariumId}/thresholds/{parameter}`.
- [x] 1.4 Export the per-parameter sanity ranges and unit map as constants in `thresholds.ts` (temperature 0–45 °C, salinity 0–100 ppt, phosphate 0–100 ppm), matching `backend/src/aquarium_parameter_thresholds.py`'s `THRESHOLD_SANITY_RANGES`/`THRESHOLD_UNITS`.

## 2. Routing

- [x] 2.1 Add `AquariumDetailPage` as a lazy-loaded route `/aquariums/:id` in `src/App.tsx`, following the existing `React.lazy` pattern used for other pages.

## 3. Aquarium detail page

- [x] 3.1 Create `src/pages/AquariumDetailPage.tsx`: read `id` via `useParams`, load the record via the new `getAquarium(id)`; show a not-found state with a link back to `/aquariums` on a 404.
- [x] 3.2 Move the existing name/type/volume edit form fields and validation/submit logic from `AquariumsPage`'s `Drawer` into the detail page, saving via the existing `updateAquarium`.
- [x] 3.3 Add a "Parameter Limits" section to the detail page with one row per parameter (`temperature`, `salinity`, `phosphate`), each with `min`/`max`/`target` `NumberInput`s and its own "Save" action and loading/error state.
- [x] 3.4 On mount, fetch each parameter's threshold via `getThreshold` and pre-fill its row; treat "no threshold configured" (all-null response) as empty inputs, not an error.
- [x] 3.5 Implement client-side validation per row: values within that parameter's sanity range, and `min <= target <= max` when multiple are set; block save and show a message if violated.
- [x] 3.6 On save, call `setThreshold` for that row only; on success update the row's displayed values, on failure show that row's error (including mapped API validation messages) without affecting other rows.

## 4. Aquariums list page

- [x] 4.1 In `src/pages/AquariumsPage.tsx`, change the "Edit" button's `onClick` to navigate to `/aquariums/:id` (via `useNavigate`/`Link`) instead of opening the edit `Drawer`.
- [x] 4.2 Remove the now-unused edit-mode branch from the `Drawer`/state (`selectedAquarium`, `drawerTitle`, edit-specific `formValues` prefill) while keeping the "Add Aquarium" create flow working as before.
- [x] 4.3 Verify the "Add Aquarium" quick-create flow still works unchanged (still a Drawer/Modal, not the new detail page).

## 5. Tests

- [x] 5.1 Update/add tests under `src/test/pages/AquariumsPage.test.tsx` for the edit button navigating instead of opening a drawer.
- [x] 5.2 Add `src/test/pages/AquariumDetailPage.test.tsx` covering: loading and pre-filling existing thresholds, empty-threshold state, successful save per parameter, client-side ordering/range validation, and independent per-row failure handling.
- [x] 5.3 Add tests for `getAquarium` and for `src/api/thresholds.ts` request/response mapping and shape guards, mirroring existing `src/test` coverage style for `aquariums.ts`/`measurements.ts`.

## 6. Manual verification

- [x] 6.1 Run `npm run build` and `npm run test` to confirm type-checking and the full suite pass.
- [x] 6.2 Run the app (`npm run dev` plus backend), click "Edit" on an aquarium, confirm it opens the full-page detail view, and confirm saving both the aquarium fields and parameter limits round-trips correctly against the real API.
