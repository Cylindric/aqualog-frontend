## MODIFIED Requirements

### Requirement: Users can add salinity measurements
The system SHALL allow users to submit new aquarium measurements for supported parameters including salinity and phosphate, with salinity represented in ppt and phosphate represented in ppm.

#### Scenario: Successful multi-parameter measurement creation
- **WHEN** a user selects an aquarium, provides a shared measured-at value, enters one or more valid parameter values, and submits the form
- **THEN** the system sends create requests for each provided parameter value and confirms success in the UI

#### Scenario: Parameter units are shown correctly
- **WHEN** a user views or enters measurement values in the measurement workflow
- **THEN** the system displays and accepts salinity values in ppt and phosphate values in ppm

#### Scenario: Shared context fields appear once
- **WHEN** a user uses the measurement form
- **THEN** the aquarium selector and measured-at input are rendered once and shared across all entered parameters

#### Scenario: Validation feedback for invalid measurement input
- **WHEN** a user submits without any parameter value or with invalid parameter input
- **THEN** the system blocks submission and displays actionable validation feedback from client checks and API responses

### Requirement: Users can review measurement history
The system SHALL retrieve and display existing salinity and phosphate measurements for aquariums in user-readable history views and SHALL allow row-level deletion.

#### Scenario: Load measurement history
- **WHEN** a user opens the aquarium measurements section
- **THEN** the system requests measurements from the API and renders parameter history ordered from newest to oldest

#### Scenario: Delete a measurement entry
- **WHEN** a user clicks Delete on a measurement row
- **THEN** the system removes the selected entry through the API and refreshes the displayed history

#### Scenario: Empty history guidance
- **WHEN** no measurements exist for the selected aquarium
- **THEN** the system displays an empty-state message explaining how to add the first measurement

#### Scenario: Recoverable history retrieval or delete failure
- **WHEN** measurement history retrieval or deletion fails due to connectivity, timeout, or non-success API response
- **THEN** the system shows a recoverable error state with a retry action

### Requirement: Users can visualize salinity trends
The system SHALL provide parameter-specific visualizations of historical salinity and phosphate measurements to support trend analysis.

#### Scenario: Salinity visualization renders with available history
- **WHEN** salinity history contains two or more records
- **THEN** the system renders a salinity trend chart using all salinity records for the selected aquarium

#### Scenario: Phosphate visualization uses target thresholds
- **WHEN** phosphate history contains two or more records
- **THEN** the system renders a phosphate trend chart with an optimal reference line at 0.075 ppm and a color scale that is green from 0.00 to 0.10, fading to red at 0.20 and above

#### Scenario: Visualization fallback for sparse or unavailable data
- **WHEN** parameter visualization data is insufficient or rendering cannot be completed
- **THEN** the system keeps measurement history accessible in non-visual form without blocking user workflows
