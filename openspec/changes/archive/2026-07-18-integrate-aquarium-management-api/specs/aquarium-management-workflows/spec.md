## MODIFIED Requirements

### Requirement: Management workflows for aquarium records
The system SHALL allow users to create, view, update, and remove supported aquarium management records exposed by the backend API.

#### Scenario: Load aquarium records from API
- **WHEN** a user opens the aquariums management view
- **THEN** the system requests aquarium records from the backend API and renders the returned data set in the UI

#### Scenario: Successful record creation
- **WHEN** a user submits valid data for a supported record type
- **THEN** the system creates the record through the API and reflects the new item in the UI without requiring an additional confirmation step

#### Scenario: Validation feedback on invalid input
- **WHEN** a user submits incomplete or invalid data for a record form
- **THEN** the system blocks submission and displays field-level or form-level validation feedback from client and API responses

#### Scenario: Successful record update
- **WHEN** a user edits an existing record and confirms changes
- **THEN** the system persists changes through the API and updates the displayed data without requiring a separate destructive-action prompt

#### Scenario: Deletion requires confirmation
- **WHEN** a user initiates deletion for an existing aquarium record
- **THEN** the system presents a confirmation prompt before sending the delete request

#### Scenario: Successful record deletion
- **WHEN** a user confirms removal of an existing aquarium record in the deletion prompt
- **THEN** the system deletes the record through the API and removes it from the displayed list

#### Scenario: Recoverable API failure during management operations
- **WHEN** listing or mutating aquarium records fails due to connectivity, timeout, or non-success API response
- **THEN** the system displays a user-visible recoverable error state and provides a retry path
