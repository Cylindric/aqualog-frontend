## Purpose
Let signed-in users view their profile and edit their display name from within the app.

## Requirements

### Requirement: View own profile
The system SHALL provide a profile page, reachable from primary navigation, where the signed-in user can view their current username, display name, and member-since date.

#### Scenario: Profile page loads current data
- **WHEN** a signed-in user navigates to the profile page
- **THEN** the system fetches and displays their current username, display name, and member-since date

#### Scenario: Profile data fails to load
- **WHEN** the profile fetch request fails
- **THEN** the system shows a recoverable error state with a retry action instead of a blank page

### Requirement: Edit display name
The system SHALL allow the signed-in user to change their display name from the profile page and persist it via the backend profile API.

#### Scenario: Successful display name update
- **WHEN** a user enters a valid new display name and submits the edit
- **THEN** the system saves the change via the profile API and shows the updated display name with a success indication

#### Scenario: Empty display name rejected before submit
- **WHEN** a user clears the display name field and attempts to submit
- **THEN** the system shows an inline validation error and does not send the request

#### Scenario: Display name exceeding maximum length rejected before submit
- **WHEN** a user enters a display name longer than 120 characters and attempts to submit
- **THEN** the system shows an inline validation error and does not send the request

#### Scenario: Server rejects the update
- **WHEN** the profile update request fails
- **THEN** the system shows an error message and keeps the user's unsaved edit in the field so they can retry

### Requirement: Profile navigation entry
The system SHALL expose a primary navigation entry that links to the profile page from any top-level portal page.

#### Scenario: Navigation link is reachable
- **WHEN** a signed-in user is viewing any top-level portal page
- **THEN** the primary navigation includes a link to the profile page reachable in one interaction

### Requirement: Profile data includes group memberships
The system SHALL include the signed-in user's group memberships (a list of group names) when fetching their profile from `/api/v1/me`, and SHALL derive whether the user is an AquaLog administrator from membership in the `AquaLogAdmins` group.

#### Scenario: Profile response includes groups
- **WHEN** the profile fetch response includes a `groups` array
- **THEN** the system parses it onto the profile data and treats the user as an AquaLog administrator if and only if `AquaLogAdmins` is present in that array

#### Scenario: Profile response omits groups
- **WHEN** the profile fetch response does not include a `groups` field
- **THEN** the system treats the user as having no group memberships (not an AquaLog administrator) rather than failing to parse the profile
