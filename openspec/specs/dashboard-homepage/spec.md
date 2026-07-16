## Purpose
Define the dashboard homepage behavior for authenticated users and establish a scalable home surface for feature navigation.

## Requirements

### Requirement: Authenticated users land on dashboard
The system SHALL display the dashboard homepage as the default landing page for authenticated users.

#### Scenario: User completes authentication
- **WHEN** a user successfully authenticates
- **THEN** the system redirects them to the dashboard route (`/dashboard`)

#### Scenario: Direct navigation to dashboard
- **WHEN** an authenticated user navigates directly to `/dashboard`
- **THEN** the system displays the dashboard homepage

### Requirement: Dashboard provides navigation to Salinity Calculator
The dashboard SHALL include a clearly visible button to access the Salinity Calculator feature.

#### Scenario: User clicks Salinity Calculator button
- **WHEN** a user clicks the "Salinity Calculator" button on the dashboard
- **THEN** the system navigates to the Salinity Calculator page

### Requirement: Dashboard layout supports future expansion
The dashboard layout SHALL be designed to accommodate additional feature shortcuts without requiring structural changes.

#### Scenario: Dashboard displays with single feature
- **WHEN** the dashboard renders with only the Salinity Calculator button
- **THEN** the layout SHALL remain clean and centered

#### Scenario: Dashboard is ready for additional features
- **WHEN** new feature buttons are added to the dashboard
- **THEN** the layout SHALL adapt without breaking existing functionality

### Requirement: Dashboard is accessible to authenticated users only
The dashboard route SHALL only be accessible to users who have completed authentication.

#### Scenario: Unauthenticated user attempts dashboard access
- **WHEN** an unauthenticated user navigates to `/dashboard`
- **THEN** the system redirects them to the authentication flow

#### Scenario: Authenticated user accesses dashboard
- **WHEN** an authenticated user accesses the dashboard
- **THEN** the system displays the dashboard content without additional authentication prompts
