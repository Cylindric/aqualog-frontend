## ADDED Requirements

### Requirement: Users can add salinity measurements
The system SHALL allow users to submit a new salinity measurement for a selected aquarium using the `aquarium-measurements` API, with salinity represented in `ppt`.

#### Scenario: Successful salinity measurement creation
- **WHEN** a user selects an aquarium, enters valid measurement data, and submits the form
- **THEN** the system sends a create request to the measurement API and confirms success in the UI

#### Scenario: Measurement unit is shown as ppt
- **WHEN** a user views or enters salinity measurement values in the measurement workflow
- **THEN** the system displays and accepts salinity values in `ppt`

#### Scenario: Validation feedback for invalid measurement input
- **WHEN** a user submits incomplete or invalid measurement data
- **THEN** the system blocks submission and displays actionable validation feedback from client checks and API responses

### Requirement: Users can review measurement history
The system SHALL retrieve and display existing salinity measurements for aquariums in a user-readable history view.

#### Scenario: Load measurement history
- **WHEN** a user opens the aquarium measurements section
- **THEN** the system requests measurements from the API and renders results ordered from newest to oldest

#### Scenario: Empty history guidance
- **WHEN** no measurements exist for the selected aquarium
- **THEN** the system displays an empty-state message explaining how to add the first measurement

#### Scenario: Recoverable history retrieval failure
- **WHEN** the measurement history request fails due to connectivity, timeout, or non-success API response
- **THEN** the system shows a recoverable error state with a retry action

### Requirement: Users can visualize salinity trends
The system SHALL provide a visualization of historical salinity measurements to support trend analysis.

#### Scenario: Visualization renders with available history
- **WHEN** measurement history contains one or more records
- **THEN** the system renders a time-based visual summary of salinity values and their timestamps using all available history by default

#### Scenario: Visualization fallback for sparse or unavailable data
- **WHEN** visualization data is insufficient or rendering cannot be completed
- **THEN** the system keeps measurement history accessible in non-visual form without blocking user workflows

### Requirement: Measurement UI follows Mantine 9 component syntax
The system SHALL implement measurement UI layout and components using Mantine 9 APIs and SHALL NOT use obsolete Mantine 8-only prop names.

#### Scenario: Grid spacing uses Mantine 9 prop names
- **WHEN** measurement UI layout uses Mantine `Grid`
- **THEN** spacing uses Mantine 9 `gap`/`rowGap`/`columnGap` props and does not use obsolete `gutter`
