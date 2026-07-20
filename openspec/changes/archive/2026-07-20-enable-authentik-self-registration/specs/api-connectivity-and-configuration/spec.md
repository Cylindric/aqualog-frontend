## ADDED Requirements

### Requirement: OIDC runtime configuration key consistency
The system SHALL document and validate OIDC runtime configuration keys using the same variable names consumed by frontend runtime loading and backend runtime-config exposure.

#### Scenario: Operator follows runtime configuration guidance
- **WHEN** an operator configures OIDC callback and logout redirect settings for deployment
- **THEN** the documented variable names match the keys consumed by runtime config loading and prevent authentication bootstrap failures

#### Scenario: Runtime OIDC redirect key is missing
- **WHEN** required OIDC redirect/logout runtime keys are absent or empty
- **THEN** the system surfaces configuration error guidance that identifies the missing keys