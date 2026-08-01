## ADDED Requirements

### Requirement: Configurable authentication mode
The system SHALL support a runtime-configured authentication mode, `AQUALOG_AUTH_MODE`, with allowed values `oauth` and `none`. When the value is absent or unrecognized, the system SHALL behave as if `oauth` was selected.

#### Scenario: Auth mode defaults to oauth
- **WHEN** the portal starts without `AQUALOG_AUTH_MODE` set (or set to an unrecognized value)
- **THEN** the system uses the existing provider-hosted OIDC authentication flow unchanged

#### Scenario: Auth mode explicitly set to oauth
- **WHEN** the portal starts with `AQUALOG_AUTH_MODE=oauth`
- **THEN** the system uses the existing provider-hosted OIDC authentication flow unchanged

#### Scenario: Auth mode set to none
- **WHEN** the portal starts with `AQUALOG_AUTH_MODE=none`
- **THEN** the system does not initiate an OIDC sign-in redirect, does not require an authenticated session, and renders the application routes directly

### Requirement: No authenticated-session UI when auth is disabled
When `AQUALOG_AUTH_MODE=none`, the system SHALL NOT display sign-in/sign-out controls or authenticated-user identity that depend on an OIDC session.

#### Scenario: Shell navigation with auth disabled
- **WHEN** `AQUALOG_AUTH_MODE=none` and the application shell renders
- **THEN** the system does not show a "Sign out" control or a signed-in username, since no authenticated session exists

#### Scenario: Callback route reached with auth disabled
- **WHEN** `AQUALOG_AUTH_MODE=none` and a user navigates to `/auth/callback`
- **THEN** the system redirects to the application's home route without attempting to process an OIDC callback

## MODIFIED Requirements

### Requirement: Clear onboarding and auth failure guidance
The system SHALL provide user-visible guidance when provider-managed registration or sign-in cannot be completed, when `AQUALOG_AUTH_MODE=oauth`. When `AQUALOG_AUTH_MODE=none`, no such guidance applies since no provider-hosted authentication is attempted.

#### Scenario: Provider enrollment disabled or denied by policy
- **WHEN** `AQUALOG_AUTH_MODE=oauth` and provider authentication returns an error indicating signup is unavailable or rejected
- **THEN** the system shows a recoverable error state with actionable guidance (for example retry sign-in or contact administrator)

#### Scenario: Callback processing cannot restore session
- **WHEN** `AQUALOG_AUTH_MODE=oauth` and the callback route cannot restore an authenticated session
- **THEN** the system shows an authentication-required state with a path to restart provider authentication
