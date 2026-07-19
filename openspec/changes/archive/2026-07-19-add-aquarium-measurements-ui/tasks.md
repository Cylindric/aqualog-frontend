## 1. API Integration and Data Contracts

- [x] 1.1 Review `aquarium-measurements` endpoints from OpenAPI and define frontend request/response types for measurement create/list operations
- [x] 1.2 Implement measurement API client functions for listing measurements and creating a new measurement, including consistent error normalization
- [x] 1.3 Add API-layer tests covering successful create/list calls and recoverable failure responses

## 2. Measurement UI Section

- [x] 2.1 Add a new measurements section/page entry in navigation and route configuration
- [x] 2.2 Implement a measurement creation form with aquarium selection, salinity input, client-side validation, and submit handling
- [x] 2.3 Enforce salinity unit display and input as ppt across measurement create and history views
- [x] 2.4 Implement measurement history display ordered newest to oldest with explicit loading and empty states
- [x] 2.5 Add recoverable error UI with retry for failed measurement fetch or create operations

## 3. Visualization and UX Completion

- [x] 3.1 Implement a salinity trend visualization component based on historical measurements and timestamps
- [x] 3.2 Add a non-visual fallback/history presentation when visualization data is sparse or chart rendering is unavailable
- [x] 3.3 Refresh measurement history after successful create to ensure UI reflects canonical API state

## 4. Validation and Test Coverage

- [x] 4.1 Add component/page tests for measurement submission success and validation-error behavior
- [x] 4.2 Add UI tests for history loading, empty state, recoverable fetch failure, and retry behavior
- [x] 4.3 Add tests for visualization rendering with data and fallback behavior without blocking history access
- [x] 4.4 Execute existing relevant test suites and address regressions introduced by the new measurement workflow
