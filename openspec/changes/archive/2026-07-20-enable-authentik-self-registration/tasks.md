## 1. Authentik Enrollment Definition

- [ ] 1.1 Configure and document open-signup launch policy acceptance criteria.
- [x] 1.2 Document required Authentik flow/policy configuration for login plus enrollment.
- [ ] 1.3 Validate callback and post-logout redirect URI settings against SPA routes and deployment domains.

## 2. Frontend Onboarding Experience

- [x] 2.1 Add or refine authentication status/callback messaging for first-time user onboarding and policy rejection outcomes.
- [x] 2.2 Keep signup entry fully provider-hosted and verify no app-visible create-account link is introduced.
- [x] 2.3 Ensure sign-in, sign-out, and callback flows remain unchanged for existing users.

## 3. Configuration and Documentation Alignment

- [x] 3.1 Update runtime configuration documentation/examples to use consumed OIDC redirect/logout variable names.
- [x] 3.2 Add deployment notes describing required Authentik application settings and common misconfiguration symptoms.

## 4. Verification

- [x] 4.1 Add/update tests for auth onboarding states, callback errors, and existing-user regression paths.
- [ ] 4.2 Validate end-to-end in staging using a newly registered account and a pre-existing account.