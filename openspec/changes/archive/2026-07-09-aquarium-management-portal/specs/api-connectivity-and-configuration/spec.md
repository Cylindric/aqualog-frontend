## ADDED Requirements

### Requirement: Configurable API base URL
The system SHALL support a configurable backend API base URL without requiring source code changes for each deployment environment.

#### Scenario: Environment-provided API address
- **WHEN** the portal starts with a configured API base URL
- **THEN** the system uses that address for all backend requests

#### Scenario: Missing API address configuration
- **WHEN** the portal starts without a valid API base URL
- **THEN** the system presents a configuration error state with guidance for correction

### Requirement: Contract-aligned API communication
The system SHALL issue requests and handle responses in a manner aligned with the backend OpenAPI contract.

#### Scenario: Contract-compatible request mapping
- **WHEN** the UI invokes a supported backend operation
- **THEN** the system sends request paths, methods, and payload formats that match the OpenAPI-defined operation

#### Scenario: Contract-compatible response handling
- **WHEN** the backend returns a successful response for a supported operation
- **THEN** the system maps response data into UI models without dropping required fields

### Requirement: Robust API failure handling
The system SHALL provide user-visible, recoverable feedback for backend connectivity and request failures.

#### Scenario: Transient API failure
- **WHEN** a request fails due to timeout or network interruption
- **THEN** the system displays an actionable error message and offers a retry path

#### Scenario: Backend validation or conflict error
- **WHEN** the API returns a structured client error for a user action
- **THEN** the system surfaces the relevant error details near the affected workflow
