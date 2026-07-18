## Context

The current authenticated shell uses a fixed bottom navigation bar and a centered content container. That layout works for the existing route set, but it leaves limited horizontal space for content and does not take advantage of a wider desktop viewport. The requested change is a Mantine 9 shell update that moves primary navigation to the left using a DoubleNavbar-style layout while keeping the app responsive.

## Goals / Non-Goals

**Goals:**
- Replace the bottom navigation with a left-side persistent navigation shell.
- Preserve the current route structure, active-state behavior, and readiness/auth checks.
- Keep the layout usable on small screens without introducing horizontal scrolling.
- Minimize the scope of the change to shell composition and navigation presentation.

**Non-Goals:**
- No backend API changes.
- No route additions or route hierarchy changes.
- No redesign of page-level content such as dashboard, calculator, or aquariums views.
- No authentication flow changes.

## Decisions

- Use the existing shell component as the single layout orchestrator instead of spreading layout logic across pages. This keeps nav placement, responsive behavior, and readiness states in one place. Alternative: create a higher-order layout wrapper, but that would add indirection without reducing complexity.
- Model navigation as a single route config shared by the shell and nav rendering. This avoids duplicated labels, icons, and active-route rules. Alternative: keep nav items hard-coded in multiple components, but that increases drift risk.
- Replace the bottom navigation with a left-side DoubleNavbar presentation on larger screens, while keeping a compact mobile navigation pattern for handheld viewports. Alternative: keep the bottom nav and add a desktop sidebar, but that would maintain two separate navigation patterns and dilute consistency.
- Preserve the existing content boundary and spacing semantics as much as possible, then adjust the main content width only if the new shell creates excessive empty space. Alternative: remove the content width constraint entirely, but that risks overly wide line lengths on large monitors.

## Risks / Trade-offs

- [Layout regressions on smaller screens] -> Validate the shell at phone, tablet, and desktop breakpoints and keep the compact navigation behavior intact.
- [Main content feels too narrow or too wide after the sidebar move] -> Tune the shell content width and spacing after the new nav rail is in place.
- [Active navigation state diverges from route matching] -> Keep route paths and nav definitions derived from the same source of truth.
- [Replacing the bottom nav may remove a familiar interaction pattern] -> Preserve the same destinations and route order so the change is structural, not functional.

## Migration Plan

1. Update the shell layout to host the left navigation pattern and keep the readiness/error states in place.
2. Replace the bottom navigation component with the new left-side navigation rendering.
3. Verify responsive behavior across the primary breakpoints and adjust spacing or content width as needed.
4. Remove any now-unused bottom navigation styling or imports once the new shell is stable.

## Open Questions

- What exact breakpoint should switch between the compact mobile navigation and the left-side DoubleNavbar layout?
- Should the compact mobile variant remain bottom-aligned, or move to a different condensed pattern when the sidebar is hidden?