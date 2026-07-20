# identity-authentication-and-onboarding Specification

## Purpose
Define requirements for delegated identity authentication and onboarding behavior using a provider-hosted OIDC flow.

## Requirements

### Requirement: Delegated identity onboarding with provider-managed registration
The system SHALL delegate account registration and authentication to the configured OIDC provider and SHALL NOT implement local account creation in the SPA.

#### Scenario: New user self-registration through provider
- **WHEN** an unauthenticated first-time user starts authentication
- **THEN** the system redirects to the configured OIDC provider where account creation can be completed if provider enrollment is enabled

#### Scenario: Open signup launch policy
- **WHEN** provider enrollment is configured for open signup
- **THEN** a new user can complete account creation without pre-issued invites or domain allowlist membership

#### Scenario: Existing user sign-in remains available
- **WHEN** an unauthenticated returning user starts authentication
- **THEN** the system provides the same provider-hosted sign-in path and callback completion behavior as before

### Requirement: Clear onboarding and auth failure guidance
The system SHALL provide user-visible guidance when provider-managed registration or sign-in cannot be completed.

#### Scenario: Provider enrollment disabled or denied by policy
- **WHEN** provider authentication returns an error indicating signup is unavailable or rejected
- **THEN** the system shows a recoverable error state with actionable guidance (for example retry sign-in or contact administrator)

#### Scenario: Callback processing cannot restore session
- **WHEN** the callback route cannot restore an authenticated session
- **THEN** the system shows an authentication-required state with a path to restart provider authentication

### Requirement: Provider-hosted signup entry
The system SHALL keep signup entry provider-hosted in this iteration and SHALL NOT add an app-visible create-account entry point.

#### Scenario: Unauthenticated user begins auth journey
- **WHEN** a user accesses any application route
- **THEN** the system redirects to provider-hosted login/enrollment and does not render an app-level create-account link

#### Scenario: Provider UX is source of signup navigation
- **WHEN** a first-time user needs account creation
- **THEN** signup navigation is completed within provider-hosted pages before returning to the app callback route
