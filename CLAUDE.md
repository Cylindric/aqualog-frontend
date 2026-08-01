# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository context

This is the `frontend/` submodule of the AquaLog project (own git remote: `git@github.com:Cylindric/aqualog-frontend.git`). It is checked out inside a parent orchestration repo but commits/branches/pushes must be made from within this directory, independently of the parent.

## Working practices

Using an isolated git worktree for a task is fine. However, do **not** push worktree branches to `origin` or open pull requests (draft or otherwise) as part of finishing a task — commit locally and leave the branch/worktree in place for the user to review, push, and open a PR themselves. Only push or open a PR if the user explicitly asks for it in that conversation.

## Commands

```bash
npm run dev          # Vite dev server on port 9002
npm run build         # tsc -b && vite build (type-check, then bundle)
npm run test          # vitest run (single pass)
npm run test:watch    # vitest watch mode
npm run preview       # preview the production build
```

Single test file: `npx vitest run src/test/pages/AquariumsPage.test.tsx`
Single test by name: `npx vitest run src/test/pages/AquariumsPage.test.tsx -t "test name"`

There is no ESLint config in this repo — don't invent lint commands.

Taskfile (`task <name>`) wraps some of the above plus Docker packaging:
- `task setup` — `./tools/setup.sh`
- `task backend` — `npm ci && npm run build`, then runs the built app behind the FastAPI shim (`uvicorn backend.main:app`) on `$FRONTEND_PORT_HTTP`
- `task frontend` — `npm ci && npm run dev`
- `task build` — production build + Docker image build/tag
- `task scan` — Trivy vulnerability scan of the built image

## Architecture

### Frontend UI

The app is built using the React framework with the Mantine 9 component library. The documentation for Mantine is here: https://mantine.dev/llms.txt

### Runtime config, not build-time config

The app is built once and reconfigured per-environment at runtime, not rebuilt. `src/config.ts::loadRuntimeConfig()` is awaited in `src/main.tsx` before React renders; it fetches `/api/runtime-config` and populates a module-level `config` object (API base URL, OIDC authority/client/redirect URIs/scope, app version string). `isConfigured()` / `hasOidcConfig()` / `configErrors()` gate rendering — `App.tsx` shows `ConfigErrorPage` if `isConfigured()` is false.

`/api/runtime-config` is served by the tiny FastAPI shim at `backend/main.py` (separate Python project at repo root: `pyproject.toml`/`poetry.lock`, managed with Poetry + commitizen, not part of the npm app). It whitelists specific `AQUALOG_*` env vars from its own process environment and also serves the built SPA as static files with an `index.html` fallback. The same static build is reused across dev/staging/prod by changing this shim's env vars, never by rebuilding the frontend. All `AQUALOG_*` var names are a contract shared with the backend API and Authentik config — see `.env.example`.

### Auth flow

OIDC Authorization Code + PKCE via `react-oidc-context`/`oidc-client-ts`, wired in `src/auth/OidcProvider.tsx`:
- `OidcProvider` wraps the app in `AuthProvider` (no-ops if `hasOidcConfig()` is false) and strips OIDC query params from the URL on signin callback.
- `AuthTokenBridge` (rendered only once the user is authenticated, in `App.tsx`) registers the current access token and a silent-refresh callback with the API client via `setAccessTokenProvider`/`setRefreshAccessTokenProvider`.
- `App.tsx`'s `AuthenticatedApp` drives the actual auth state machine: redirects unauthenticated users to sign-in, shows status screens while `auth.isLoading`/`activeNavigator` is truthy, and renders `toAuthFailureGuidance()` (from `src/auth/authErrorMessaging.ts`) on `auth.error`.
- `/auth/callback` is a dedicated top-level route (`AuthCallbackPage`), routed *outside* the authenticated-app tree so the callback can complete before the auth gate runs.

### API client

`src/api/client.ts` exports a single `apiRequest<T>` used by all `src/api/*.ts` modules (`aquariums.ts`, `measurements.ts`, `salinity.ts`). Key behaviors to preserve when adding new API calls — use `apiGet`/`apiPost`/`apiPatch`/`apiDelete`, don't call `fetch` directly:
- Attaches the bearer token from the injected `AccessTokenProvider`; on a 401 it calls `RefreshAccessTokenProvider` once and retries.
- 10s request timeout via `AbortSignal.timeout`, combinable with a caller-supplied `AbortSignal`.
- Normalizes FastAPI's validation-error envelope (`{detail: [...]}` etc.) into `ApiRequestError` with a `validationErrors` array; `toUserMessage()` turns any thrown error into a user-facing string (distinguishes 401/403, validation errors, timeouts, and network failures).
- `checkReadiness()` hits the unauthenticated `/api/v1/ready` endpoint; used by `src/hooks/useReadinessCheck.ts` for backend-availability polling.

### Routing and pages

`src/App.tsx` defines two route trees: the unauthenticated `/auth/callback` route, and everything else behind `AuthenticatedApp`'s auth gate (`/`, `/dashboard`, `/calculator`, `/aquariums`, `/measurements`, `*` → `NotFoundPage`). All page components except the top-level `App` shell are lazy-loaded via `React.lazy`. `src/components/Shell.tsx` provides the authenticated layout/nav chrome (nav items in `src/components/primaryNav.ts`).

### Feature modules

Feature-specific logic that's more than a page component lives under `src/features/<feature>/` (e.g. `src/features/salinity/` pairs `SalinityCalculator.tsx` with a `useSalinityCalculator.ts` hook). Prefer this split — component + hook — for new non-trivial features rather than putting logic directly in a page.

### Build chunking

`vite.config.ts` manually splits vendor bundles (`vendor-charts` for `@mantine/charts`/`recharts`, `vendor-mantine`, `vendor-auth` for `react-oidc-context`/`oidc-client-ts`, `vendor-react`). The chart-libs check must run before the generic `@mantine/` check (comment in the file explains why — otherwise charts get folded into `vendor-mantine`). Keep new heavy dependencies categorized here if bundle-splitting matters.

### Tests

Vitest + Testing Library + `jsdom`, mirroring `src/` under `src/test/**`. `src/test/setup.ts` polyfills `window.matchMedia` and `ResizeObserver` (required by Mantine/next-themes in jsdom) — extend this file, don't re-polyfill per test.

## OpenSpec workflow

This repo uses an OpenSpec spec-driven workflow (`openspec/config.yaml`, `openspec/specs/`, `openspec/changes/` when a change is in flight), driven by `opsx-*` slash commands defined in both `.github/prompts/*.prompt.md` and mirrored `.github/skills/openspec-*` skill packages — keep the paired prompt and skill files behaviorally in sync when editing this workflow. Workflow boundaries: `explore` (investigation only, no artifacts/implementation), `propose` (creates proposal/design/tasks artifacts), `apply` (implements tasks, checks off `tasks.md`), `sync` (merges delta specs into `openspec/specs`), `archive` (archives a completed change directory). `openspec/config.yaml`'s `context` block is the place to add shared project context that should influence generated artifacts.

`.agents/skills/mantine-*` (tracked via `skills-lock.json`) are vendored third-party skills for Mantine forms/combobox/custom components — separate from the OpenSpec workflow.
