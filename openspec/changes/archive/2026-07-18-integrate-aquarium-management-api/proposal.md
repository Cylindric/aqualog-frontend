## Why

The Aquariums page still uses demo placeholder data and does not persist user actions, which prevents real aquarium management workflows from functioning end to end. Now that the AquaLog API exposes aquarium management endpoints, the frontend should switch from mock state to authenticated API-backed create, read, update, and delete flows.

## What Changes

- Replace hardcoded mock aquarium records on the Aquariums page with API-backed data loading.
- Implement API-backed create and update actions for aquarium records from the existing drawer form.
- Add API-backed deletion support for aquarium records in the list view.
- Introduce loading, empty, and recoverable error states tied to aquarium API request outcomes.
- Add or update API and UI tests covering aquarium management request/response behavior and error handling.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `aquarium-management-workflows`: Aquarium record management changes from placeholder/demo behavior to functional API-backed CRUD workflows with user-visible loading and error handling.

## Impact

- Affected code: `AquariumsPage` UI state and form submission flow, new/updated aquarium API modules, and related tests.
- APIs: Uses newly available AquaLog aquarium management endpoints for list/create/update/delete operations.
- Dependencies: Reuses existing authenticated API client and error mapping helpers.
- Systems: Frontend browser application behavior changes; backend service contracts are consumed but not changed.