## Context

The application currently redirects authenticated users directly to specific tool pages (e.g., Salinity Calculator). There is no central landing page to orient users or provide an overview of available features. The existing architecture includes:
- React Router for routing with authentication callbacks
- Mantine for component styling
- Bottom navigation component for app-wide navigation
- OIDC-based authentication flow via OidcProvider
- Existing pages: CalculatorPage, AuthCallbackPage, ConfigErrorPage, NotFoundPage

## Goals / Non-Goals

**Goals:**
- Create a dashboard route that serves as the authenticated home page
- Design an extensible layout that can accommodate future feature additions
- Integrate with existing authentication and navigation systems
- Provide clear, accessible navigation to the Salinity Calculator
- Maintain consistency with existing Mantine design patterns

**Non-Goals:**
- Redesigning existing pages or navigation components
- Adding user personalization or dashboard customization features
- Implementing analytics or usage tracking
- Creating a dashboard for unauthenticated users

## Decisions

### Decision 1: Dashboard as default post-authentication route
**Choice:** Redirect authenticated users to `/dashboard` instead of a specific tool page.

**Rationale:** Provides a stable entry point that won't break as new features are added. Users get context about available features before diving into specific tools.

**Alternatives considered:**
- Keep direct tool redirection: Simpler initially but doesn't scale as features grow
- Use `/home` route: Less semantic for an application dashboard

### Decision 2: Feature card/button layout pattern
**Choice:** Use a grid-based card or button layout with each feature as a clickable navigation element.

**Rationale:** 
- Mantine provides responsive grid components out of the box
- Card pattern is familiar to users and easily extensible
- Supports icons, descriptions, and visual hierarchy
- Scales well from 1 to many features

**Alternatives considered:**
- List-based navigation: Less visual, harder to scan at scale
- Sidebar navigation: Already using bottom nav; would create competing patterns

### Decision 3: Co-locate dashboard with other pages
**Choice:** Create `DashboardPage.tsx` in `src/pages/` alongside existing pages.

**Rationale:**
- Maintains consistency with existing project structure
- Dashboard is a page-level component, not a feature or utility
- Easier to find and maintain alongside other routes

**Alternatives considered:**
- `src/features/dashboard/`: Overkill for a simple navigation page
- `src/components/`: Dashboard is a page, not a reusable component

### Decision 4: Protect dashboard route with authentication guard
**Choice:** Wrap dashboard route in the same authentication pattern used by other protected routes.

**Rationale:**
- Consistent with existing authentication architecture
- OidcProvider already handles authentication state
- Router can conditionally render based on auth status

**Alternatives considered:**
- Implement custom guard: Unnecessary duplication of existing auth logic
- Public dashboard with conditional content: Violates requirement that dashboard is auth-only

### Decision 5: Update bottom navigation to include dashboard
**Choice:** Add dashboard icon/link to BottomNav component.

**Rationale:**
- Users need quick access back to dashboard from any page
- Establishes dashboard as a first-class navigation destination
- Consistent with mobile-first bottom nav pattern

**Alternatives considered:**
- Logo/home link in header: No header currently exists
- Breadcrumb navigation: Overkill for flat navigation structure

## Risks / Trade-offs

**Risk:** Dashboard becomes cluttered as features grow  
→ **Mitigation:** Implement pagination, categories, or search when feature count exceeds ~8-12 items

**Risk:** Bottom nav gets crowded with dashboard + tool links  
→ **Mitigation:** Bottom nav should contain only high-level destinations (Dashboard, primary tools). Secondary tools accessed via dashboard only.

**Trade-off:** Adding dashboard adds one extra click to reach tools  
→ **Benefit:** Users gain context and discoverability; dashboard becomes natural starting point

**Risk:** Inconsistent authentication state between dashboard and OidcProvider  
→ **Mitigation:** Use existing OIDC hooks/context; don't duplicate auth state

## Migration Plan

1. Create DashboardPage component with initial Salinity Calculator button
2. Add `/dashboard` route to router configuration
3. Update post-authentication redirect logic to point to `/dashboard`
4. Add dashboard link to BottomNav component
5. Test authentication flow and route protection
6. Deploy behind feature flag if available, or direct to production (low risk change)

**Rollback strategy:** Revert post-auth redirect to previous tool-specific route. Dashboard route can remain as optional destination without breaking existing flows.

## Open Questions

- Should the dashboard display user information (name, email) or remain purely functional?
- Should we add analytics to track which dashboard buttons are clicked?
- Future: How should we organize features once count exceeds single-page capacity (categories, search, favorites)?
