## ADDED Requirements

### Requirement: Profile data includes group memberships
The system SHALL include the signed-in user's group memberships (a list of group names) when fetching their profile from `/api/v1/me`, and SHALL derive whether the user is an AquaLog administrator from membership in the `AquaLogAdmins` group.

#### Scenario: Profile response includes groups
- **WHEN** the profile fetch response includes a `groups` array
- **THEN** the system parses it onto the profile data and treats the user as an AquaLog administrator if and only if `AquaLogAdmins` is present in that array

#### Scenario: Profile response omits groups
- **WHEN** the profile fetch response does not include a `groups` field
- **THEN** the system treats the user as having no group memberships (not an AquaLog administrator) rather than failing to parse the profile
