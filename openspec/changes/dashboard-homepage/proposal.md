## Why

Users currently land directly on specific tools like the Salinity Calculator after authentication, with no central starting point or overview of available features. A dashboard homepage provides a clear entry point that improves discoverability and sets the foundation for future feature expansion.

## What Changes

- Add a new Dashboard page component that serves as the default authenticated landing page
- Create a dashboard route that displays after successful login
- Implement a navigation button on the dashboard to access the Salinity Calculator
- Update routing configuration to redirect authenticated users to the dashboard
- Design a clean, extensible layout that can accommodate additional feature shortcuts as the platform grows

## Capabilities

### New Capabilities
- `dashboard-homepage`: User-facing dashboard that serves as the authenticated home page with quick access to platform features

### Modified Capabilities
<!-- No existing capabilities require spec-level changes -->

## Impact

- **Routes**: New `/dashboard` route; redirect logic after authentication updated
- **Navigation**: Bottom navigation may need updates to include dashboard link
- **Components**: New Dashboard page component with button-based navigation
- **User Flow**: Post-login experience changes from direct tool access to dashboard-first navigation
