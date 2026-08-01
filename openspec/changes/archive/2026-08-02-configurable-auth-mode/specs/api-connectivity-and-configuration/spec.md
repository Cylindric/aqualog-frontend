## ADDED Requirements

### Requirement: API requests without authentication when auth mode is none
The system SHALL support issuing backend API requests without an access token when `AQUALOG_AUTH_MODE=none`, and SHALL NOT attempt a 401-triggered token refresh in that mode.

#### Scenario: Authenticated-style request with auth disabled
- **WHEN** `AQUALOG_AUTH_MODE=none` and the UI invokes a backend operation via the API client
- **THEN** the system sends the request without an `Authorization` header and without requiring a registered access-token provider

#### Scenario: Backend returns 401 with auth disabled
- **WHEN** `AQUALOG_AUTH_MODE=none` and a backend response has status 401
- **THEN** the system does not attempt a silent token refresh and surfaces the response as-is

## MODIFIED Requirements

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
