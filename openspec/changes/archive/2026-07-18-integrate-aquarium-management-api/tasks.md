## 1. Aquarium API Integration

- [x] 1.1 Add or update a dedicated aquarium API module with typed list/create/update/delete request helpers using the shared authenticated client.
- [x] 1.2 Add API-focused tests for aquarium request success paths and common failure/validation responses.

## 2. Aquariums Page Refactor

- [x] 2.1 Replace mock in-memory aquarium data in `AquariumsPage` with API-backed initial loading and render loading/empty/error states.
- [x] 2.2 Wire drawer submit flows to API create/update mutations and refresh local list state from successful responses.
- [x] 2.3 Add API-backed delete action with a required confirmation prompt and remove the deleted record from rendered results after confirmation.

## 3. Verification

- [x] 3.1 Add or update UI tests that cover aquarium list loading, successful CRUD interactions, and recoverable failure states.
- [x] 3.2 Run targeted tests for aquarium page and API modules and resolve regressions.