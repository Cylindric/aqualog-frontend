## Purpose
Define behavior for viewing and editing per-parameter threshold limits (min/max/target) for an aquarium's tracked parameters (temperature, salinity, phosphate) on the aquarium detail page, backed by the backend threshold API.

## Requirements

### Requirement: View parameter limits on the aquarium detail page
The system SHALL display the configured `min`, `max`, and `target` limits for the `temperature`, `salinity`, and `phosphate` parameters on an aquarium's detail page, fetched from the backend threshold API.

#### Scenario: Limits already configured
- **WHEN** a user opens the detail page for an aquarium that has existing thresholds for a parameter
- **THEN** the system requests that parameter's threshold from the API and pre-fills the `min`, `max`, and `target` inputs with the returned values

#### Scenario: No limits configured yet
- **WHEN** a user opens the detail page for an aquarium that has no threshold configured for a parameter
- **THEN** the system shows empty `min`, `max`, and `target` inputs for that parameter without an error

### Requirement: Edit and save parameter limits
The system SHALL allow users to set or update the `min`, `max`, and `target` limits for `temperature`, `salinity`, and `phosphate` independently, persisting each parameter's limits through the backend threshold API.

#### Scenario: Successful save of a parameter's limits
- **WHEN** a user enters valid `min`, `max`, and/or `target` values for a parameter and saves
- **THEN** the system sends the values to the API for that parameter and reflects the saved values in the UI without requiring an additional confirmation step

#### Scenario: Client-side validation of value ordering
- **WHEN** a user enters values where `min` is greater than `target`, `target` is greater than `max`, or `min` is greater than `max`
- **THEN** the system blocks submission for that parameter and displays a validation message before calling the API

#### Scenario: Client-side validation of parameter sanity range
- **WHEN** a user enters a `min`, `max`, or `target` value outside that parameter's supported range
- **THEN** the system blocks submission for that parameter and displays a validation message before calling the API

#### Scenario: Server-side validation feedback
- **WHEN** saving a parameter's limits fails because the API rejects the values
- **THEN** the system displays the returned validation feedback for that parameter without discarding the user's other unsaved parameter edits

#### Scenario: Independent save per parameter
- **WHEN** saving one parameter's limits fails
- **THEN** the other parameters' limits remain editable and unaffected, and their previously saved values are not lost

#### Scenario: Recoverable API failure while loading or saving limits
- **WHEN** loading or saving a parameter's limits fails due to connectivity, timeout, or non-success API response
- **THEN** the system displays a user-visible recoverable error state for that parameter and provides a retry path
