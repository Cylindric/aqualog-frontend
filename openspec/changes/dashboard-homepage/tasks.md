## 1. Create Dashboard Page Component

- [x] 1.1 Create `DashboardPage.tsx` in `src/pages/`
- [x] 1.2 Implement dashboard layout using Chakra UI Box/Container components
- [x] 1.3 Add "Salinity Calculator" button with Chakra Button component
- [x] 1.4 Implement navigation handler to route to `/calculator` on button click
- [x] 1.5 Add appropriate icons and styling for extensible card/button layout
- [x] 1.6 Ensure responsive design that works on mobile and desktop

## 2. Add Dashboard Route

- [x] 2.1 Add `/dashboard` route to router configuration in `App.tsx` or routing file
- [x] 2.2 Protect dashboard route with authentication guard (OIDC check)
- [x] 2.3 Configure route to render `DashboardPage` component
- [x] 2.4 Test that unauthenticated users are redirected to login

## 3. Update Post-Authentication Flow

- [x] 3.1 Locate authentication callback logic in `AuthCallbackPage.tsx` or `OidcProvider.tsx`
- [x] 3.2 Update redirect logic to navigate to `/dashboard` after successful authentication
- [x] 3.3 Ensure redirect preserves any state or query parameters if needed
- [x] 3.4 Test authentication flow from login through dashboard landing

## 4. Update Navigation Components

- [x] 4.1 Add dashboard link/icon to `BottomNav.tsx` component
- [x] 4.2 Position dashboard as first or prominent item in bottom navigation
- [x] 4.3 Update navigation active state logic to highlight dashboard when on `/dashboard`
- [x] 4.4 Ensure navigation is accessible and follows existing patterns

## 5. Testing and Validation

- [x] 5.1 Verify unauthenticated users cannot access `/dashboard`
- [x] 5.2 Verify authenticated users land on dashboard after login
- [x] 5.3 Test Salinity Calculator button navigation works correctly
- [x] 5.4 Test dashboard appearance on mobile and desktop viewports
- [x] 5.5 Verify bottom navigation shows dashboard link and highlights correctly
- [x] 5.6 Test direct navigation to `/dashboard` URL
