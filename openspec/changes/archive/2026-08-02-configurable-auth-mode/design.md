## Context

The SPA currently has a single, hard-wired auth path: `main.tsx` always mounts `OidcProvider`, `App.tsx`'s `AuthenticatedApp` always redirects unauthenticated visitors into the OIDC sign-in flow, and `src/api/client.ts` always throws a 401 `ApiRequestError` if no access token provider has produced a token. Runtime config (`src/config.ts`) treats all `oidc*` fields as mandatory for `isConfigured()` to return true. This makes it impossible to run or test the SPA without a reachable Authentik instance, even for OpenSpec-style local iteration or scenarios where the backend itself has auth disabled (handled independently in `aqualog-backend`).

This is a frontend-only change. The backend's own `none`-mode behavior (skipping bearer-token validation) is out of scope here; this change only needs the frontend to *not require or send* a token when so configured, and to not gate rendering behind a sign-in redirect.

## Goals / Non-Goals

**Goals:**
- Introduce `AQUALOG_AUTH_MODE` (`oauth` | `none`) as a first-class runtime config value, following the existing `loadRuntimeConfig()`/whitelist pattern.
- Make `oauth` the default so every existing deployment (no var set) is unaffected.
- In `none` mode, remove every hard dependency on `react-oidc-context` state from the render path and from the API client's token handling.
- Keep the change small and localized to the existing config/auth/client seams already in the codebase rather than introducing a new abstraction layer.

**Non-Goals:**
- Backend enforcement/bypass of auth — handled independently in `aqualog-backend`.
- Supporting additional auth modes beyond `oauth`/`none` (e.g. API keys, basic auth) — not requested.
- Changing the OIDC flow itself when `oauth` mode is active.

## Decisions

**1. Represent the mode as a plain string union on the existing `config` object, not a new module.**
`config.authMode: 'oauth' | 'none'` sits alongside the existing `oidc*` fields in `src/config.ts`. Alternative considered: a separate `authConfig.ts` module — rejected as unnecessary indirection for a single flag that other config logic (`isConfigured`, `configErrors`) already needs to read.

**2. Unknown/missing `AQUALOG_AUTH_MODE` normalizes to `oauth`.**
Mirrors the existing tolerant-parsing style in `config.ts` (e.g. `normalizeVersionDisplay`). Ensures the default is safe (auth stays *on* unless explicitly turned off) and existing deployments need zero changes.

**3. Gate `hasOidcConfig()`'s callers, not the OIDC field validation itself.**
`hasOidcConfig()` keeps checking the same five fields; `isConfigured()`/`configErrors()` skip calling `hasOidcConfig()`/its field checks entirely when `authMode === 'none'`. This avoids duplicating the "is this URL set" logic under two different meanings.

**4. `OidcProvider` and `AuthTokenBridge` become no-ops in `none` mode, decided at the same call site that already short-circuits on `!hasOidcConfig()`.**
`OidcProvider` already renders `children` directly when OIDC config is absent (line 12-14 today). Extending that same early-return to also trigger on `authMode === 'none'` reuses an existing code path instead of adding a parallel one. `AuthTokenBridge` is simply not rendered by `App.tsx` when auth is disabled (it currently is only rendered inside the authenticated-app branch anyway).

**5. `App.tsx`'s `AuthenticatedApp` branches at the top on `authMode`, bypassing `useAuth()` entirely in `none` mode.**
Calling `useAuth()` when no `AuthProvider` is mounted throws (react-oidc-context requires context). So `none` mode needs a distinct component path that renders `Shell` + routes directly, rather than trying to make the existing state machine degrade gracefully. A small `AuthGate` wrapper picks between `OidcAuthenticatedApp` (existing logic, unchanged) and a new `OpenAuthenticatedApp` (renders immediately) based on `config.authMode`.

**6. API client: skip the token requirement instead of using a fake/empty token.**
`apiRequest` currently always sets an `Authorization: Bearer <token>` header and throws if no token exists. In `none` mode it should send the request with no `Authorization` header and never invoke the 401-refresh path (since there is no `refreshAccessTokenProvider` registered and none is expected). Implementation: `getAccessToken()`'s call site checks `config.authMode` first; when `none`, `runRequest` is invoked without setting the `Authorization` header at all, and the 401-retry branch is skipped.

**7. `/auth/callback` route: redirect to `/` in `none` mode rather than deleting the route.**
Keeps `App.tsx`'s route table static/simple. If a stale bookmark or redirect URI hits `/auth/callback` while `none` mode is active, `AuthCallbackPage` immediately navigates to `/` instead of calling `useAuth()` (which would throw without a provider).

**8. Shell's identity badge sources the username from the app's own `GET /api/v1/me` endpoint (via the existing `useProfile()` hook), not from the OIDC ID token.**
The backend resolves a real `User` row regardless of auth mode (bearer-token-derived in `oauth` mode, a default/local user in `none` mode per the independent backend change) — `GET /api/v1/me` always returns a user, so it's a strictly better identity source than `auth.user?.profile`: it works uniformly in both modes, and even in `oauth` mode is unaffected by which OIDC claims happen to be populated. `AuthStatusBadge` calls `useProfile()` unconditionally and renders whenever `profile` is loaded (`display_name` preferred, falling back to `username`, then a generic "Authenticated" label) — this is authMode-agnostic and requires no `useAuth()` call. Alternative considered: keep sourcing from `auth.user?.profile` and fake a static identity in `none` mode — rejected because it invents a value with no backing data and still special-cases two code paths instead of one.

**9. The "Sign out" control remains gated on `config.authMode === 'oauth'`, isolated in its own `SignOutButton` subcomponent that calls `useAuth()`.**
Signing out is only meaningful when there is an actual OIDC session to end. Isolating the `useAuth()` call inside `SignOutButton` (rendered only when `authMode === 'oauth'`) keeps `AuthStatusBadge` itself safe to render unconditionally without ever calling `useAuth()` when no `AuthProvider` is mounted, consistent with decision 5's constraint.

## Risks / Trade-offs

- **[Risk]** Divergent code paths (`OidcAuthenticatedApp` vs `OpenAuthenticatedApp`) could drift over time. → **Mitigation**: keep the `none`-mode path minimal (just `Shell` + `Routes`, no new logic), and cover both with Vitest so drift is caught by tests, not manual QA.
- **[Risk]** A misconfigured production deployment could accidentally ship with `AQUALOG_AUTH_MODE=none`, disabling the frontend's auth gate. → **Mitigation**: this is a deliberate, explicit opt-in string value (not a boolean flag that could be misread), and backend auth enforcement is the actual security boundary (tracked independently) — the frontend gate is UX, not a security control.
- **[Risk]** Components that call `useAuth()` outside a gated entry point would throw in `none` mode. → **Mitigation**: grep confirms `useAuth` is only used in `App.tsx`, `OidcProvider.tsx`, `AuthCallbackPage.tsx`, and `Shell.tsx`'s `SignOutButton` (rendered only when `authMode === 'oauth'`) today; tasks.md includes updating all of these.
- **[Risk]** Sourcing identity from `GET /api/v1/me` adds a network dependency to the header badge that didn't exist before (previously read straight off the already-fetched ID token). → **Mitigation**: `useProfile()` already exists and is used by `ProfilePage`; a failed/loading fetch just hides the badge (`AuthStatusBadge` returns `null`) rather than erroring, so it degrades gracefully.

## Migration Plan

No data migration. Deployment-side: add `AQUALOG_AUTH_MODE=none` to the frontend shim's environment only where reduced/no-auth is desired (e.g. local dev, test environments); omit it (or set `oauth`) everywhere else to keep current behavior. Rollback is simply removing/reverting the env var — no code rollback needed since `oauth` remains the default.

## Open Questions

None — the backend counterpart of this work is tracked separately, and this design only needs the frontend to stop requiring a token, which is independent of what the backend enforces.
