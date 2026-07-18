## MODIFIED Requirements

### Requirement: Mobile-first application shell
The system SHALL provide a responsive application shell optimized for handheld devices while remaining usable on larger screens.

#### Scenario: Shell adapts to viewport size
- **WHEN** a user opens the portal on a phone-sized viewport
- **THEN** the system renders a compact layout with touch-friendly controls and no horizontal scrolling

#### Scenario: Shell expands on larger screens
- **WHEN** a user opens the portal on a tablet or desktop viewport
- **THEN** the system presents a left-side DoubleNavbar navigation rail alongside the main content area and expands layout regions without removing core actions

### Requirement: Consistent primary navigation
The system SHALL provide persistent primary navigation so users can switch between key portal areas from any page in at most one interaction.

#### Scenario: Navigation is always reachable
- **WHEN** a user is viewing any top-level portal page
- **THEN** the system displays primary navigation controls that remain visible in the left-side DoubleNavbar on larger screens and in the compact navigation pattern on smaller screens without deep scrolling

#### Scenario: Active section is explicit
- **WHEN** a user navigates to a top-level area
- **THEN** the system indicates the active section in navigation state
