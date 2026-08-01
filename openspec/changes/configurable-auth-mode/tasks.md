## 1. Runtime config

- [ ] 1.1 Add `authMode: 'oauth' | 'none'` to `RuntimeConfig` in `src/config.ts`, parsed from a new `AQUALOG_AUTH_MODE` field in `RuntimeConfigResponse`, normalized to `'oauth'` when absent/unrecognized (mirroring `normalizeVersionDisplay`'s tolerant-parsing style).
- [ ] 1.2 Update `hasOidcConfig()` call sites (`isConfigured()`, `configErrors()`) so OIDC-key checks are skipped when `config.authMode === 'none'`; `isConfigured()` should require only `apiBaseUrl` in that mode.
- [ ] 1.3 Add `AQUALOG_AUTH_MODE` to the whitelist in `backend/main.py::_runtime_config()`.
- [ ] 1.4 Document `AQUALOG_AUTH_MODE` (values `oauth`/`none`, default `oauth`) in `.env.example`.

## 2. Auth bootstrap

- [ ] 2.1 In `src/auth/OidcProvider.tsx`, extend the existing early-return in `OidcProvider` to also trigger when `config.authMode === 'none'` (render `children` directly, no `AuthProvider`).
- [ ] 2.2 In `src/App.tsx`, split `AuthenticatedApp` into the existing OIDC-gated implementation and a new `OpenAuthenticatedApp` that renders `Shell` + the route table immediately with no `useAuth()` call; select between them based on `config.authMode` (per design.md decision 5).
- [ ] 2.3 In `src/pages/AuthCallbackPage.tsx`, redirect to `/` immediately when `config.authMode === 'none'`, before any `useAuth()` call.

## 3. Shell UI

- [ ] 3.1 In `src/components/Shell.tsx`, guard the sign-out button and username display so they only render (and only call `useAuth()`) when `config.authMode === 'oauth'`.

## 4. API client

- [ ] 4.1 In `src/api/client.ts`, make `apiRequest` skip attaching the `Authorization` header and skip the `getAccessToken()`/401-refresh-retry path entirely when `config.authMode === 'none'`.

## 5. Tests

- [ ] 5.1 Add/update `src/test/config.test.ts` (or equivalent) covering: default `authMode` is `oauth`; `none` mode makes `isConfigured()` true without OIDC keys; unrecognized values fall back to `oauth`.
- [ ] 5.2 Add tests for `App.tsx` rendering routes directly (no sign-in redirect, no `AuthStatus` screens) when `authMode` is `none`.
- [ ] 5.3 Add tests for `Shell.tsx` hiding sign-out/username when `authMode` is `none`.
- [ ] 5.4 Add tests for `AuthCallbackPage` redirecting to `/` when `authMode` is `none`.
- [ ] 5.5 Add tests for `api/client.ts` sending requests without an `Authorization` header and without throwing when no access-token provider is registered, when `authMode` is `none`.
- [ ] 5.6 Confirm existing `oauth`-mode tests still pass unchanged (regression check for the default path).

## 6. Verification

- [ ] 6.1 Run `npm run build` (type-check + bundle) and `npm run test` and confirm both pass.
- [ ] 6.2 Manually smoke-test `npm run dev` with `AQUALOG_AUTH_MODE=none` served via the runtime-config endpoint (or a local override) to confirm the app loads without redirecting to an OIDC provider.
