## 1. Project Setup And Foundation

- [x] 1.1 Initialize the React + Vite application workspace for the portal and add Chakra UI plus core routing/state dependencies.
- [x] 1.2 Establish a mobile-first app shell scaffold with route-level layout boundaries and placeholder pages for top-level navigation areas.
- [x] 1.3 Define environment/runtime configuration handling for API base URL and add startup validation for missing or invalid configuration.

## 2. API Client And Contract Integration

- [x] 2.1 Add OpenAPI contract integration workflow using http://localhost:8000/openapi.json and generate typed API bindings or validated request/response models.
- [x] 2.2 Implement a shared API client facade that applies the configured base URL and centralizes request execution.
- [x] 2.3 Implement common API error handling utilities for network timeout, structured client errors, and retry-capable failures.

## 3. Portal Shell And Navigation

- [x] 3.1 Build responsive shell containers with touch-friendly spacing and viewport-specific layout behavior for phone, tablet, and desktop.
- [x] 3.2 Implement persistent primary navigation with explicit active-state indication across all top-level routes.
- [x] 3.3 Add lightweight startup UX with loading placeholders and a recoverable top-level error state with retry action.

## 4. Aquarium Management Workflows

- [x] 4.1 Build overview dashboard page that shows aquarium summary data and highlights pending or overdue routine actions.
- [x] 4.2 Implement empty-state guidance flows for first-time use when no aquarium records are available.
- [x] 4.3 Implement CRUD flows for supported aquarium record types with field-level validation feedback.
- [x] 4.4 Implement maintenance activity logging flow and recent-history list ordered from newest to oldest.

## 5. Verification And Quality Gates

- [x] 5.1 Add unit/integration tests for navigation behavior, API configuration handling, and critical workflow success/failure states.
- [x] 5.2 Validate contract alignment by checking generated/typed client behavior against representative OpenAPI operations used by the UI.
- [x] 5.3 Perform mobile-focused manual QA pass (small viewport navigation, form usability, error/retry UX) and capture follow-up fixes.
