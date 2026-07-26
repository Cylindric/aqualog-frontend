## ADDED Requirements

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
