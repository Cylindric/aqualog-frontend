## Context

The portal currently uses OIDC redirect flow for all authentication. Unauthenticated users are sent directly to the provider login page, and the SPA does not create or store local user accounts. This architecture is correct for delegated identity, but first-time onboarding is blocked unless Authentik is configured to allow enrollment.

Current constraints:
- The SPA must remain a thin OIDC client (no custom password handling or local registration backend).
- Registration policy (open signup, invite-only, domain-restricted) belongs in Authentik flows and policies.
- Callback and logout redirect values must match both Authentik provider settings and runtime environment values consumed by the app.

## Goals / Non-Goals

**Goals:**
- Enable first-time user account registration through Authentik while preserving existing sign-in behavior.
- Define a clear user journey for sign-in, create-account, callback handling, and policy rejection outcomes.
- Keep frontend scope limited to routing/messaging/linking that supports Authentik-managed onboarding.
- Ensure deployment/runtime docs use the same OIDC variable names as runtime config consumers.

**Non-Goals:**
- No local user database or custom registration API in this repo.
- No replacement of OIDC provider or custom auth protocol work.
- No broad redesign of all auth UI beyond onboarding-supportive states.

## Decisions

- Authentik remains the single system of record for account creation and identity policy.
  - Rationale: avoids duplicating identity logic in SPA/backend and keeps compliance/policy controls centralized.
  - Alternative considered: build app-level registration endpoint; rejected due to security and lifecycle complexity.

- Launch registration policy is open signup for initial rollout.
  - Rationale: minimizes onboarding friction while the portal is in active adoption.
  - Alternative considered: invite-only/domain-restricted launch; rejected for now to reduce operational overhead and user provisioning delay.

- Frontend continues initiating authentication with OIDC redirect and does not expose an app-visible create-account affordance in this iteration.
  - Rationale: all app routes are post-authentication and signup is fully provider-hosted, so app-side registration entry points are unnecessary.
  - Alternative considered: add app-visible create-account action; rejected for this pre-release iteration to keep auth UX simple and avoid redundant provider links.

- Registration failures (policy denied, disabled enrollment, invite required) are represented as explicit callback/auth error states with actionable guidance.
  - Rationale: improves recoverability and supportability for onboarding failures.
  - Alternative considered: generic auth failure only; rejected due to poor diagnostics.

- Runtime config docs are aligned to consumed keys (`AQUALOG_OIDC_REDIRECT_URI`, `AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI`) to avoid broken auth bootstrapping.
  - Rationale: current mismatch risks deployment misconfiguration.
  - Alternative considered: preserve old variable names and map both; rejected because this is pre-release and no backward-compatibility bridge is required.

### Authentik Registration Flow Sketch

```text
+------------------+         +-------------------------+         +--------------------------+
| Browser + SPA    |         | Authentik Provider      |         | App Callback Route       |
| (OIDC client)    |         | (login + enrollment)    |         | /auth/callback           |
+---------+--------+         +------------+------------+         +------------+-------------+
          |                               |                                   |
          | visit protected route         |                                   |
          +------------------------------>|                                   |
          | 302/redirect: authorize       |                                   |
          |                               | show provider login/enrollment    |
          |                               +------------------+                |
          |                                                  |                |
          |                          existing user sign-in   |   new user enrollment
          |                                                  |                |
          |<------------------------------code + state-------+----------------+
          | process callback, exchange token, create session                  |
          +---------------------------------------------------------------> success -> /dashboard

Failure branches:
- enrollment disabled -> provider denies -> callback error view with guidance
- policy reject (invite/domain/risk) -> callback error view with guidance
- misconfigured redirect/logout -> provider or callback failure state
```

## Risks / Trade-offs

- [Open signup can increase abuse/spam risk] -> Enable baseline anti-abuse controls in Authentik (email verification, rate limiting, and optional moderation review) and monitor signup events.
- [Redirect URI mismatch blocks auth completion] -> Validate runtime values against Authentik configuration during deployment checks.
- [Users do not see an app-level signup link] -> Ensure provider login/enrollment page clearly exposes account creation and required copy.
- [Changing documented env var names could surprise existing operators] -> Call out migration note and, if needed, stage compatibility follow-up.

## Migration Plan

1. Configure target Authentik tenant/application for open-signup enrollment with baseline anti-abuse controls.
2. Add/adjust frontend onboarding messaging for auth states without introducing app-level create-account actions.
3. Update runtime config documentation and examples to match consumed OIDC variable names.
4. Add tests for auth onboarding happy path messaging and failure branches.
5. Validate in staging with a brand-new user account from registration through first successful sign-in.

Rollback strategy:
- Disable enrollment flow in Authentik to return to sign-in-only behavior.
- Revert frontend onboarding messaging changes if they conflict with provider UX.

## Open Questions

- None at this time.