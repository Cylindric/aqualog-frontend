## Context

The frontend already supports aquarium listing and salinity calculation, but persistent salinity measurement workflows are missing from the portal. The backend API now exposes `aquarium-measurements` endpoints (OpenAPI at `http://localhost:8001/api/v1/openapi.json`), creating an immediate opportunity to add measurement entry and historical visibility in the UI. This change spans API client integration, page-level UI composition, data-fetch/mutation state management, and test coverage.

## Goals / Non-Goals

**Goals:**
- Add a dedicated UI section where users can submit new salinity measurements tied to an aquarium.
- Fetch and display measurement history from API endpoints with clear loading, empty, and error states.
- Provide a visual representation of measurement trends over time.
- Keep implementation aligned with existing React/Vite/Chakra patterns and current app routing.
- Add automated tests for API and user-visible behavior.

**Non-Goals:**
- Backend API design or schema changes.
- Advanced analytics, predictive modeling, or alerting logic.
- Bulk import/export for historical measurement data.
- Reworking unrelated navigation or dashboard architecture.

## Decisions

1. Add a dedicated measurement feature slice with API service, page-level container, and reusable presentation components.
Rationale: The change introduces a distinct workflow and data model; isolating concerns keeps existing aquarium CRUD and calculator features stable.
Alternatives considered:
- Extending the existing aquariums page only: rejected because it risks overloading a single page and coupling unrelated responsibilities.
- Embedding measurement behavior directly in generic API client utilities: rejected because feature-level orchestration becomes harder to test.

2. Use optimistic refresh (post-mutation refetch) rather than fully optimistic local writes for create flows.
Rationale: Measurement creation must reflect API-calculated/normalized values and authoritative timestamps; refetching reduces client/server divergence risk while remaining simple.
Alternatives considered:
- Immediate local append before server response: rejected to avoid displaying transient records with potentially incorrect IDs or canonical values.

3. Use a lightweight trend visualization that can degrade gracefully to tabular history.
Rationale: Users need quick pattern recognition, but the app should remain functional if visualization rendering fails or data is sparse.
Alternatives considered:
- Chart-only display: rejected due to accessibility and sparse-data usability gaps.
- Table-only display: rejected because it weakens trend readability.

4. Keep measurement state handling explicit (loading, empty, recoverable error) at the section level.
Rationale: Measurement endpoints are new and likely to surface integration issues; explicit states improve UX and diagnosability.
Alternatives considered:
- Global generic error banner only: rejected because users lose actionable retry context for the measurement flow.

5. Use `ppt` as the salinity unit in this iteration.
Rationale: The current API contract returns salinity in `ppt`, so aligning UI input/output to `ppt` avoids conversion ambiguity and keeps behavior consistent.
Alternatives considered:
- Supporting unit switching now: deferred to a later iteration to keep scope focused on core measurement capture and history.

6. Default trend visualization to all available measurement history.
Rationale: Showing full history by default maximizes visibility for user analysis and matches current iteration goals.
Alternatives considered:
- Defaulting to a bounded time window (for example 30 days): only acceptable if the selected chart component natively enforces this behavior.

7. Keep measurement creation only in the dedicated measurements section.
Rationale: A single entry point reduces UI duplication and complexity while the workflow is new.
Alternatives considered:
- Adding creation affordances in aquarium detail views now: deferred to a later iteration.

## Risks / Trade-offs

- [Risk] API contract mismatches (field names, units, timestamps) could break forms or visualizations. → Mitigation: Validate request/response typing against OpenAPI and add API tests for happy/error paths.
- [Risk] Increased page complexity from form + history + visualization in one section. → Mitigation: Split into focused components with clear props and keep orchestration in a container component.
- [Risk] Trend chart may be hard to interpret with sparse or irregular data. → Mitigation: Pair visualization with sortable history table and clear empty-state guidance.
- [Risk] Additional fetches after mutation may increase network usage. → Mitigation: Scope refetch to measurements data only and avoid broad page reloads.

## Migration Plan

1. Add measurement API client functions and types.
2. Implement measurement section/page UI with add/list/visualize behavior and state handling.
3. Integrate navigation entry points and route wiring.
4. Add and run tests for API and UI scenarios.
5. Rollback strategy: hide or remove measurement route/section and revert measurement API client usage without impacting existing aquarium workflows.

## Open Questions

- None for this iteration.
