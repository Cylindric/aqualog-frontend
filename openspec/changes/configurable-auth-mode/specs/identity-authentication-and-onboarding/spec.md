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

### Requirement: Application-sourced identity display, independent of auth mode
The system SHALL display the current user's identity in the application shell by reading it from the application's own current-user endpoint (`GET /api/v1/me`), not from OIDC token claims, so identity display works identically regardless of `AQUALOG_AUTH_MODE`.

#### Scenario: Identity badge shown in oauth mode
- **WHEN** `AQUALOG_AUTH_MODE=oauth` and the application shell renders for an authenticated user
- **THEN** the system shows the signed-in identity using the display name (or username) returned by the application's current-user endpoint, not raw OIDC profile claims

#### Scenario: Identity badge shown in none mode
- **WHEN** `AQUALOG_AUTH_MODE=none` and the application shell renders
- **THEN** the system shows the signed-in identity using the display name (or username) returned by the application's current-user endpoint, exactly as it does in oauth mode

#### Scenario: Identity not yet available
- **WHEN** the application's current-user endpoint has not yet returned a result (still loading, or failed)
- **THEN** the system omits the identity badge rather than showing stale or placeholder identity text

### Requirement: Sign-out control limited to oauth mode
The system SHALL only display a "Sign out" control when `AQUALOG_AUTH_MODE=oauth`, since there is no OIDC session to terminate when auth is disabled.

#### Scenario: Sign-out shown in oauth mode
- **WHEN** `AQUALOG_AUTH_MODE=oauth` and the application shell renders for an authenticated user
- **THEN** the system shows a "Sign out" control that ends the OIDC session

#### Scenario: Sign-out hidden when auth is disabled
- **WHEN** `AQUALOG_AUTH_MODE=none` and the application shell renders
- **THEN** the system does not show a "Sign out" control

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
