## Context

This change introduces a new frontend portal for home aquarium management in a repository that currently focuses on OpenSpec workflow assets rather than an existing app implementation. The portal must consume a separately deployed backend API and support a configurable API base address, with local development aligned to the OpenAPI contract at http://localhost:8000/openapi.json. Primary users are hobbyists who often interact from mobile devices while performing tank maintenance.

## Goals / Non-Goals

**Goals:**
- Deliver a lightweight, mobile-first web UI built with React, Vite, and Chakra.
- Provide clear navigation and fast access to aquarium overview, records, and routine workflows.
- Isolate API communication behind a configurable client layer so deployments can target different backend addresses.
- Keep frontend behavior contract-aligned with backend API definitions.

**Non-Goals:**
- Designing or changing backend API endpoints, data contracts, or database schemas.
- Implementing offline-first sync or native mobile app packaging in this change.
- Adding advanced analytics, notifications, or multi-user collaboration features beyond core portal behavior.

## Decisions

1. Frontend stack: React + Vite + Chakra UI.
- Rationale: Vite provides fast iteration and small production bundles; React enables modular UI composition; Chakra supports accessible, responsive components with minimal custom CSS for mobile-first delivery.
- Alternative considered: Next.js with server rendering. Rejected for now because backend is already a separate API and static SPA hosting keeps deployment simpler.

2. Mobile-first shell and navigation model.
- Rationale: Users interact during aquarium tasks, typically on phones. Bottom navigation and compact, task-focused screens minimize friction.
- Alternative considered: Desktop-first sidebar-only layout. Rejected because it degrades one-handed mobile usability.

3. API integration through a typed client facade with runtime-configurable base URL.
- Rationale: A single client abstraction centralizes request behavior, error handling, and environment switching while preserving compatibility with the OpenAPI contract.
- Alternative considered: Direct fetch calls in each feature component. Rejected because it duplicates networking concerns and complicates testing.

4. Feature composition around capability domains.
- Rationale: Grouping code by shell/navigation, management workflows, and API connectivity keeps implementation aligned with specs and simplifies incremental delivery.
- Alternative considered: Layer-only folder split (components/pages/services). Rejected because domain-based ownership is clearer for future feature growth.

5. API base URL should be deployment-configured only.
- Rationale: The backend is a part of this application stack, so will not be user-configuratble.

6. The only capability in-scope for the initial release is a calculator for determining the quantity of salt to add to a given volume of water to increase the salnity from a start level to a target level.


## Risks / Trade-offs

- [API schema drift between environments] -> Mitigation: Validate generated/typed client behavior against the declared OpenAPI source in CI or pre-release checks.
- [Mobile-friendly layouts may hide dense information] -> Mitigation: Use progressive disclosure patterns and optional expanded detail views.
- [Configurable API endpoint can be misconfigured by operators] -> Mitigation: Provide explicit validation, health check feedback, and clear fallback/error states.
- [Single-page app startup cost on low-end devices] -> Mitigation: Keep route-level code splitting and avoid heavy dependencies outside Chakra and required API tooling.

## Migration Plan

- No data migration is required because this change introduces a new frontend portal.
- Deploy strategy: publish the SPA artifact and configure runtime API base URL per environment.
- Rollback strategy: redeploy previous frontend build; backend remains unchanged.

## Open Questions

- Is authentication already handled by the backend contract, and if so, which token/session flow should the UI implement first?
