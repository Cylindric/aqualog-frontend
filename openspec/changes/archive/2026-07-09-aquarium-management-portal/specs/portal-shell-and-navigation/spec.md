## ADDED Requirements

### Requirement: Mobile-first application shell
The system SHALL provide a responsive application shell optimized for handheld devices while remaining usable on larger screens.

#### Scenario: Shell adapts to viewport size
- **WHEN** a user opens the portal on a phone-sized viewport
- **THEN** the system renders a compact layout with touch-friendly controls and no horizontal scrolling

#### Scenario: Shell supports larger screens
- **WHEN** a user opens the portal on a tablet or desktop viewport
- **THEN** the system expands layout regions and navigation affordances without removing core actions

### Requirement: Consistent primary navigation
The system SHALL provide persistent primary navigation so users can switch between key portal areas from any page in at most one interaction.

#### Scenario: Navigation is always reachable
- **WHEN** a user is viewing any top-level portal page
- **THEN** the system displays primary navigation controls that remain accessible without deep scrolling

#### Scenario: Active section is explicit
- **WHEN** a user navigates to a top-level area
- **THEN** the system indicates the active section in navigation state

### Requirement: Lightweight startup experience
The system SHALL present a meaningful initial UI state quickly and avoid blocking the entire viewport on non-critical data.

#### Scenario: Initial skeleton on first load
- **WHEN** the portal starts and feature data is still loading
- **THEN** the system shows shell content and loading placeholders rather than a blank page

#### Scenario: Recoverable top-level error state
- **WHEN** startup requests fail
- **THEN** the system displays an error state with a retry action that does not require full browser refresh
