## ADDED Requirements

### Requirement: Aquarium overview visibility
The system SHALL provide an overview view summarizing the current aquarium status and pending routine actions.

#### Scenario: User opens dashboard
- **WHEN** a user navigates to the overview area
- **THEN** the system presents aquarium summary information and highlights pending or overdue tasks

#### Scenario: Empty-state guidance
- **WHEN** overview data is unavailable because no records exist yet
- **THEN** the system shows clear empty-state guidance for creating initial records

### Requirement: Management workflows for aquarium records
The system SHALL allow users to create, view, update, and remove supported aquarium management records exposed by the backend API.

#### Scenario: Successful record creation
- **WHEN** a user submits valid data for a supported record type
- **THEN** the system creates the record through the API and reflects the new item in the UI

#### Scenario: Validation feedback on invalid input
- **WHEN** a user submits incomplete or invalid data for a record form
- **THEN** the system blocks submission and displays field-level validation feedback

#### Scenario: Successful record update
- **WHEN** a user edits an existing record and confirms changes
- **THEN** the system persists changes through the API and updates the displayed data

### Requirement: Maintenance activity tracking
The system SHALL allow users to log routine maintenance activities and review recent maintenance history.

#### Scenario: Log maintenance event
- **WHEN** a user records a maintenance action
- **THEN** the system stores the event through the API and adds it to maintenance history

#### Scenario: Review recent maintenance
- **WHEN** a user opens maintenance history
- **THEN** the system shows recent events ordered from newest to oldest
