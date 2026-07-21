## Why

Container images should expose the exact application version they were built with so operators can verify deployments quickly and correlate runtime behavior with source and release history. The UI currently does not show this build version, which makes troubleshooting and validation harder.

## What Changes

- Bake the current version from pyproject.toml into the container image at build time and make it available to the frontend runtime.
- Add a small status line at the bottom of the GUI that displays the current container/app version.
- Define fallback behavior when version metadata is unavailable so the UI remains stable.

## Capabilities

### New Capabilities
- `container-version-visibility`: Build and surface the container-baked application version in the portal UI.

### Modified Capabilities
- `portal-shell-and-navigation`: Add persistent footer status text showing the running version in the shell layout.

## Impact

- Affected code: Docker build/runtime wiring, frontend configuration bootstrap, and shell layout/footer rendering.
- Affected systems: Container build pipeline and web client runtime environment.
- Dependencies: Existing frontend configuration path that reads runtime values and shell components that render global layout chrome.
