# api-connectivity-and-configuration Specification

## Purpose
Define requirements for configuring, contract-aligning, and robustly handling failures for the frontend's backend API connectivity, including runtime OIDC configuration key consistency.

## Requirements

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

### Requirement: OIDC runtime configuration key consistency
The system SHALL document and validate OIDC runtime configuration keys using the same variable names consumed by frontend runtime loading and backend runtime-config exposure. These OIDC keys SHALL only be required for a valid configuration when `AQUALOG_AUTH_MODE` is `oauth` (or unset).

#### Scenario: Operator follows runtime configuration guidance
- **WHEN** an operator configures OIDC callback and logout redirect settings for deployment with `AQUALOG_AUTH_MODE=oauth`
- **THEN** the documented variable names match the keys consumed by runtime config loading and prevent authentication bootstrap failures

#### Scenario: Runtime OIDC redirect key is missing in oauth mode
- **WHEN** `AQUALOG_AUTH_MODE=oauth` (or unset) and required OIDC redirect/logout runtime keys are absent or empty
- **THEN** the system surfaces configuration error guidance that identifies the missing keys

#### Scenario: OIDC keys absent while auth mode is none
- **WHEN** `AQUALOG_AUTH_MODE=none` and OIDC redirect/logout runtime keys are absent or empty
- **THEN** the system does not surface configuration errors for those OIDC keys and considers runtime configuration valid based on the remaining required values

### Requirement: API requests without authentication when auth mode is none
The system SHALL support issuing backend API requests without an access token when `AQUALOG_AUTH_MODE=none`, and SHALL NOT attempt a 401-triggered token refresh in that mode.

#### Scenario: Authenticated-style request with auth disabled
- **WHEN** `AQUALOG_AUTH_MODE=none` and the UI invokes a backend operation via the API client
- **THEN** the system sends the request without an `Authorization` header and without requiring a registered access-token provider

#### Scenario: Backend returns 401 with auth disabled
- **WHEN** `AQUALOG_AUTH_MODE=none` and a backend response has status 401
- **THEN** the system does not attempt a silent token refresh and surfaces the response as-is
