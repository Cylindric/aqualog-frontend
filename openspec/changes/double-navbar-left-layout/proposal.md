## Why

The current shell uses a bottom navigation pattern that works, but it leaves the main content area narrow and makes the app feel less like a full portal on larger screens. Moving primary navigation into a left-side DoubleNavbar improves scanability, creates more room for content, and gives the layout a clearer desktop-first structure while preserving responsive behavior.

## What Changes

- Replace the existing bottom navigation with a left-side DoubleNavbar shell layout.
- Keep primary navigation persistent and clearly indicate the active route.
- Preserve a responsive experience so the shell still works well on smaller screens.
- Update the application chrome so the header, navigation, and main content feel like one cohesive Mantine layout.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `portal-shell-and-navigation`: Shell layout and primary navigation presentation change from bottom navigation to a left-side DoubleNavbar while keeping navigation persistent and responsive.

## Impact

- Affected code: Mantine shell/layout components, primary navigation component(s), and route chrome.
- APIs: No backend API changes.
- Dependencies: Mantine layout primitives and any responsive styling used by the shell.
- Systems: Browser UI only; navigation behavior changes across dashboard, calculator, and aquariums views.