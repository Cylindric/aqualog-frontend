## Why

Home aquarium care requires frequent tracking of livestock, equipment, water parameters, and routine tasks, but this data is often scattered across notes and apps. A lightweight mobile-friendly portal is needed now to centralize management while integrating with an existing backend API.

## What Changes

- Build a React + Vite + Chakra web portal optimized for quick use on phones and tablets.
- Add core aquarium management views for overview, records, and routine activity tracking.
- Integrate with a separately hosted backend API using a configurable base URL.
- Generate and maintain a typed client contract from the backend OpenAPI document to keep frontend behavior aligned with API capabilities.

## Capabilities

### New Capabilities
- `portal-shell-and-navigation`: Responsive application shell, navigation patterns, and mobile-first interaction model.
- `aquarium-management-workflows`: User-facing workflows for viewing and managing aquarium-related entities and routine actions.
- `api-connectivity-and-configuration`: Configurable API endpoint management and OpenAPI-driven integration behavior.

### Modified Capabilities
None.

## Impact

- Affected code: New frontend application structure, routing, state/query layers, and Chakra-based UI components.
- APIs: Reads backend contract from `http://localhost:8000/openapi.json` during development for client integration.
- Dependencies: React, Vite, Chakra UI, and OpenAPI tooling for typed client generation/validation.
- Systems: Browser clients on mobile and desktop; backend service remains separate and configurable by base URL.
