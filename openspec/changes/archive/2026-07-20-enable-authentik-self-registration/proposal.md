## Why

New users cannot self-onboard today unless an administrator pre-creates accounts in the identity provider. Since authentication is delegated to Authentik, account registration should be enabled and governed there while preserving a simple, predictable SPA auth experience.

## What Changes

- Define a registration-capable authentication onboarding flow where unauthenticated users are redirected to Authentik and can choose sign-in or account creation.
- Set launch registration policy to open signup in Authentik (no invite or domain allowlist required for initial rollout).
- Keep frontend auth UX provider-driven in this iteration (no app-visible create-account link) while preserving no-local-registration boundaries.
- Specify Authentik-side configuration requirements for enrollment flow, policy controls, and redirect compatibility with existing OIDC callback/logout routes.
- Define error and fallback behavior when self-registration is disabled, unavailable, or rejected by policy.
- Align runtime configuration documentation with the environment variable names currently consumed by the frontend runtime config endpoint.

## Capabilities

### New Capabilities
- `identity-authentication-and-onboarding`: OIDC authentication entry, Authentik-managed self-registration, onboarding messaging, and failure handling for first-time users.

### Modified Capabilities
- `api-connectivity-and-configuration`: Runtime environment configuration guidance is updated to reflect actual OIDC redirect/logout variable names expected by the frontend/backend runtime config path.

## Impact

- Affected code: authentication entrypoint states, callback/failure messaging, runtime configuration docs/examples, and related tests.
- APIs: no backend business API contract changes; continues using OIDC Authorization Code Flow with PKCE via Authentik.
- Dependencies: no new libraries required; relies on existing `react-oidc-context` setup and Authentik provider configuration.
- Systems: requires Authentik enrollment/policy configuration plus deployment config alignment for redirect/logout variables.