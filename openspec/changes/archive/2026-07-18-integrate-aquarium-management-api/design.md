## Context

The Aquariums page currently renders a hardcoded in-memory list and uses local drawer state for add/edit actions, so user operations are not persisted and do not reflect backend truth. The API contract now exposes aquarium management endpoints, and the frontend already has an authenticated request client with timeout and error translation utilities that can be reused for this feature.

## Goals / Non-Goals

**Goals:**
- Replace placeholder aquarium data with API-backed list loading.
- Implement API-backed create, update, and delete actions for aquarium records.
- Keep responsive table/drawer UX while introducing explicit loading, empty, and recoverable error states.
- Reuse existing API auth/error conventions to stay consistent with other feature calls.

**Non-Goals:**
- No backend API or contract changes.
- No redesign of global shell/navigation patterns.
- No new cross-feature dashboards or maintenance history enhancements beyond aquarium record CRUD.

## Decisions

- Introduce a dedicated aquarium API module (separate from page components) that wraps endpoint paths and payload/response typing, while reusing the existing authenticated API client for transport concerns. Alternative: inline fetch logic in `AquariumsPage`, rejected because it couples UI and transport details and makes testing harder.
- Use optimistic-local UI updates only after successful API responses (server-first commit) for create/update/delete list mutations. Alternative: fully optimistic writes with rollback, rejected for now to reduce state complexity while endpoint behavior is still being validated.
- Keep drawer form structure mostly unchanged and map form values to API payload contracts in one translation layer. Alternative: redesign the form and model at the same time, rejected to minimize scope and migration risk.
- Require an explicit confirmation prompt before deleting an aquarium record, while keeping create and edit as immediate submit actions from the drawer. Alternative: immediate delete action, rejected to reduce accidental destructive operations.
- Surface errors with existing user-message mapping helpers and provide retry affordances for initial list loads. Alternative: raw status-code messaging, rejected for poorer user experience and inconsistency.

## Risks / Trade-offs

- [Endpoint payload mismatch with current form fields] -> Validate mappings against OpenAPI definitions and add API tests for serialization/deserialization.
- [Slow or failed network affects perceived UX] -> Provide loading indicators, actionable error messaging, and retry for list fetch.
- [Concurrent edits from multiple clients can create stale local view] -> Always rehydrate local state from successful API responses and offer manual refresh behavior.
- [Adding CRUD flows increases page state complexity] -> Isolate API calls and mutation helpers from presentational rendering logic.

## Migration Plan

1. Add aquarium API client wrappers for list/create/update/delete endpoint operations using the existing authenticated API transport.
2. Refactor `AquariumsPage` to fetch live aquarium records and replace mock in-memory state.
3. Wire drawer submit and delete actions to API mutations and refresh local list state from responses.
4. Add/update API and page tests for successful operations, validation errors, and request failures.
5. Remove mock aquarium constants and dead placeholder code paths once tests pass.

## Open Questions

- Which exact field names and enum values should be canonical in frontend model mapping (for example, aquarium type/unit naming) based on the latest OpenAPI schema?
