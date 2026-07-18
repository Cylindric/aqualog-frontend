## 1. Shell Layout

- [x] 1.1 Refactor `Shell` to render a left-side DoubleNavbar layout alongside the main content area while preserving readiness and error states.
- [x] 1.2 Remove the fixed bottom navigation from the shell so the new left navigation becomes the only primary navigation surface.

## 2. Navigation Behavior

- [x] 2.1 Centralize the primary navigation items so the left rail and any compact mobile navigation share the same route definitions and labels.
- [x] 2.2 Preserve active-route highlighting and auth controls in the updated shell chrome without overlapping the new navigation layout.

## 3. Verification

- [x] 3.1 Add or update component tests for desktop and mobile shell rendering, including left-nav presence and active route state.
- [x] 3.2 Run the targeted test suite for the touched shell and navigation components and fix any layout regressions.