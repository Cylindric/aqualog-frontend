# Aqualog Frontend

## Dev Environment Setup

This project is built with Vite, TypeScript, React, and Vitest. On a new Ubuntu machine, set up the environment from the repository root.

## Runtime Configuration

This frontend uses OpenID Connect Authorization Code Flow with PKCE against Authentik.
Configure environment variables in `.env.local` (copy from `.env.example`):

```bash
VITE_API_BASE_URL=https://aqualog.home.cylindric.net
VITE_OIDC_AUTHORITY=https://auth.aqualog.home.cylindric.net/application/o/aqualog-spa/
VITE_OIDC_CLIENT_ID=doc-replace-with-aqualog-spa-client-id
VITE_OIDC_REDIRECT_URI=https://aqualog.home.cylindric.net/auth/callback
VITE_OIDC_POST_LOGOUT_REDIRECT_URI=https://aqualog.home.cylindric.net
VITE_OIDC_SCOPE="openid profile email offline_access"
```

Notes:

- `VITE_OIDC_REDIRECT_URI` must exactly match the callback URL configured in Authentik.
- `VITE_OIDC_POST_LOGOUT_REDIRECT_URI` must be allowed by Authentik for logout redirects.
- `VITE_OIDC_SCOPE` should include API-required scopes in addition to `openid`.

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
