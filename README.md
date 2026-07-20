# Aqualog Frontend

[![Bump version](https://github.com/Cylindric/aqualog-frontend/actions/workflows/bumpversion.yaml/badge.svg)](https://github.com/Cylindric/aqualog-frontend/actions/workflows/bumpversion.yaml)
[![Build container](https://github.com/Cylindric/aqualog-frontend/actions/workflows/build_container.yaml/badge.svg)](https://github.com/Cylindric/aqualog-frontend/actions/workflows/build_container.yaml)

## Dev Environment Setup

This project is built with Vite, TypeScript, React, and Vitest. On a new Ubuntu machine, set up the environment from the repository root.

## Runtime Configuration

This frontend uses OpenID Connect Authorization Code Flow with PKCE against Authentik.
Configure environment variables in `.env.local` (copy from `.env.example`):

```bash
AQUALOG_API_BASE_URL=https://aqualog.home.cylindric.net
AQUALOG_OAUTH_ISSUER_URL=https://auth.aqualog.home.cylindric.net/application/o/aqualog-spa/
AQUALOG_OAUTH_CLIENT_ID=doc-replace-with-aqualog-spa-client-id
AQUALOG_OIDC_REDIRECT_URI=https://aqualog.home.cylindric.net/auth/callback
AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI=https://aqualog.home.cylindric.net
AQUALOG_OAUTH_SCOPE="openid profile email offline_access"
```

Notes:

- `AQUALOG_OIDC_REDIRECT_URI` must exactly match the callback URL configured in Authentik.
- `AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI` must be allowed by Authentik for logout redirects.
- `AQUALOG_OAUTH_SCOPE` should include API-required scopes in addition to `openid`.

### Authentik Deployment Notes

- Signup entry is provider-hosted. The application should not expose a separate create-account link.
- For pre-release onboarding, configure Authentik enrollment for open signup.
- Recommended baseline anti-abuse controls in Authentik: email verification and signup rate limiting.
- Detailed step-by-step runbook: `docs/authentik-enrollment-runbook.md`.

Common misconfiguration symptoms:

- Missing or incorrect `AQUALOG_OIDC_REDIRECT_URI`: users cannot complete callback and are returned to authentication-required/error states.
- Missing or incorrect `AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI`: sign-out completes at provider but fails to return users to the expected app location.
- Issuer/client mismatch (`AQUALOG_OAUTH_ISSUER_URL`, `AQUALOG_OAUTH_CLIENT_ID`): provider sign-in fails or loops before session is established.

### 1. Install system packages

Install the basic tools needed to clone and build the project:

```bash
sudo apt update
sudo apt install -y git curl build-essential
```

### 2. Install Node.js

Use a current Node.js LTS release. Node 20 LTS is a safe choice for this project.

If you use `nvm`, install and activate Node like this:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 3. Install project dependencies

From the repository root, install the JavaScript dependencies:

```bash
npm install
```

### 4. Build and test

Run the project scripts from the repository root, not from `src/`:

```bash
npm run build
npm run test
```

### 5. Run the app locally

For day-to-day development and manual verification:

```bash
npm run dev
```

If you want to check the production build locally after a successful build:

```bash
npm run preview
```

### Notes

- The build script runs TypeScript compilation first and then Vite production bundling.
- The test suite uses Vitest.
- If a command fails unexpectedly, confirm that you are in the repository root and that Node.js 20+ is active.
