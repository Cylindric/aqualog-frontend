## ADDED Requirements

### Requirement: Shell indicates AquaLog administrators
The system SHALL display a small crown indicator next to the signed-in user's name in the top bar identity badge when that user is an AquaLog administrator, and SHALL NOT display it otherwise.

#### Scenario: Administrator sees the crown indicator
- **WHEN** a signed-in user who is a member of the `AquaLogAdmins` group views any top-level portal page
- **THEN** the top bar identity badge displays a crown icon next to their name

#### Scenario: Non-administrator does not see the crown indicator
- **WHEN** a signed-in user who is not a member of the `AquaLogAdmins` group views any top-level portal page
- **THEN** the top bar identity badge displays their name without a crown icon
