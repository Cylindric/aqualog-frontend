## Context

The portal currently has no first-class way to identify the running build from within the UI, and container builds do not explicitly expose a frontend-visible version value derived from pyproject.toml. This creates friction for operations and support teams when validating deployments, correlating incidents, and confirming rollback/roll-forward outcomes.

The change spans build-time and runtime boundaries:
- Build layer: capture pyproject.toml version during container image build.
- Runtime configuration layer: expose that captured value to the web client.
- UI shell layer: display the value in a persistent, low-noise status line at the bottom of the application shell.

## Goals / Non-Goals

**Goals:**
- Ensure each container image carries the application version from pyproject.toml as immutable build metadata consumed by the frontend.
- Surface the version in the portal shell as a small footer status line visible across top-level pages.
- Keep behavior stable when version metadata is absent or malformed by showing a safe fallback label.

**Non-Goals:**
- Introducing a full release management dashboard or build metadata history.
- Displaying git SHA, build timestamp, or deployment environment labels in this change.
- Changing backend API contracts for version retrieval.

## Decisions

1. Build-time version source is pyproject.toml
- Decision: Use pyproject.toml as the single source of truth for the displayed version.
- Rationale: It aligns with existing project packaging/versioning semantics and avoids divergence between Python packaging and container/runtime identity.
- Alternatives considered:
  - Manual Docker ARG input: rejected because it is error-prone and can drift from committed version.
  - Deriving version from git tags at build time: rejected because local/tag state may not always be available in all build environments.

2. Version is injected into frontend runtime configuration during image build/startup
- Decision: Wire the derived version through the existing frontend configuration path that already reads runtime values.
- Rationale: Reuses established configuration flow and avoids adding a separate transport channel.
- Alternatives considered:
  - Dedicated backend endpoint: rejected due to unnecessary coupling and runtime dependency.
  - Hardcoding into bundled code without runtime config: rejected because it complicates environment portability and existing config conventions.

3. UI placement is a compact shell footer status line
- Decision: Render the version in persistent shell chrome at the bottom of the GUI.
- Rationale: Meets visibility requirement without competing with page content and remains discoverable across routes.
- Alternatives considered:
  - Header/badge placement: rejected because it increases visual noise in high-attention navigation areas.
  - Showing only on dashboard page: rejected because deployment verification should be globally accessible.

4. Fallback behavior favors clarity over blank state
- Decision: If no valid version is available, show a concise fallback such as Version: unavailable.
- Rationale: Explicitly communicates missing metadata while preserving layout stability and avoiding misleading empty UI.
- Alternatives considered:
  - Hide status line when missing: rejected because absence is ambiguous and harder to diagnose.

5. Display format uses v-prefixed semantic version text
- Decision: Render the runtime version as a v-prefixed label (for example, v0.2.3).
- Rationale: The prefix improves quick visual recognition as a version token and keeps formatting consistent across environments.
- Alternatives considered:
  - Display raw semantic version with no prefix: rejected due to reduced scanability in compact footer text.

6. Local development uses the same unavailable fallback
- Decision: Non-container local development SHALL display the same fallback label when baked metadata is not present.
- Rationale: Keeps behavior deterministic and avoids introducing a separate local-only version source.
- Alternatives considered:
  - Read local package metadata directly in development: rejected to prevent environment-specific branching and divergence.

## Risks / Trade-offs

- [Risk] Build pipeline fails to parse pyproject.toml version consistently across environments.
  - Mitigation: Use a deterministic extraction method in Docker build steps and validate in container build tests.

- [Risk] Runtime config mismatch between local/dev and containerized production paths.
  - Mitigation: Keep configuration key naming consistent and validate with both local run and container run checks.

- [Trade-off] Persistent footer consumes a small amount of vertical space.
  - Mitigation: Keep typography subtle and compact, matching existing shell spacing conventions.

## Migration Plan

1. Add container build/startup wiring to propagate pyproject.toml version into frontend runtime configuration.
2. Extend frontend config handling to read and normalize version string with fallback.
3. Add shell footer status line rendering the normalized version label.
4. Validate behavior in local development and built container images.
5. Rollback strategy: remove the new config key usage and footer rendering; prior behavior restores without data migration.

## Open Questions

None.
