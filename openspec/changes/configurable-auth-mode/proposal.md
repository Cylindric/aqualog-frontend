## Why

Every local/manual test run currently requires a live Authentik instance and a full OIDC round-trip, which slows down day-to-day frontend development and testing, and blocks running the SPA standalone. The auth mechanism also needs to evolve independently of OIDC in the future, so the app needs a pluggable auth mode rather than a hard-wired OIDC dependency.

## What Changes

- Add a new runtime config value, `AQUALOG_AUTH_MODE`, with two supported values: `oauth` (default, current behavior) and `none`.
- When `AQUALOG_AUTH_MODE=oauth`, behavior is unchanged: the app boots `OidcProvider`, gates routes behind the sign-in redirect flow, and attaches bearer tokens to API requests.
- When `AQUALOG_AUTH_MODE=none`:
  - The app skips OIDC provider setup, the sign-in redirect, and the auth status/loading screens entirely — routes render immediately.
  - The API client no longer requires or attaches an access token, and no longer 401-retries via silent refresh.
  - The "Sign out" control and any user-identity display (e.g. `preferred_username`) are hidden, since there is no authenticated session.
  - The `/auth/callback` route becomes a harmless no-op/redirect to `/` (no OIDC provider is present to complete a callback against).
- Extend `isConfigured()`/`configErrors()` so OIDC-specific keys are only required when `AQUALOG_AUTH_MODE=oauth`; an unset or unrecognized `AQUALOG_AUTH_MODE` value falls back to `oauth` to keep existing deployments working unchanged.
- Add `AQUALOG_AUTH_MODE` to the frontend shim's runtime-config whitelist (`backend/main.py`) and to `.env.example`.
- **BREAKING**: none — `oauth` remains the default when the new variable is absent, so existing deployments require no changes.

Out of scope: this change only affects the frontend SPA and its runtime-config shim. Backend API enforcement of "no auth required" is being handled independently in the `aqualog-backend` repo and is not part of this change.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `identity-authentication-and-onboarding`: adds a configurable auth mode; when set to `none`, the system SHALL bypass provider-hosted sign-in/callback entirely and render the app without an authenticated session.
- `api-connectivity-and-configuration`: runtime configuration validation SHALL treat OIDC keys as conditionally required based on `AQUALOG_AUTH_MODE`, and the API client SHALL support issuing requests without an access token when auth is disabled.

## Impact

- `src/config.ts` — new `authMode` field, whitelist parsing, conditional `hasOidcConfig()`/`configErrors()` logic.
- `src/main.tsx`, `src/auth/OidcProvider.tsx` — conditionally mount `AuthProvider`/`AuthTokenBridge`.
- `src/App.tsx` — skip the auth-gate state machine (loading/redirect/error screens) when auth is disabled.
- `src/components/Shell.tsx` — hide sign-out/user-identity UI when auth is disabled.
- `src/pages/AuthCallbackPage.tsx` — no-op/redirect when auth is disabled.
- `src/api/client.ts` — allow requests without a token when auth is disabled; skip 401 refresh retry path.
- `backend/main.py` — whitelist `AQUALOG_AUTH_MODE` in `/api/runtime-config`.
- `.env.example` — document the new variable.
- Existing and new Vitest coverage under `src/test/**` for both modes.
