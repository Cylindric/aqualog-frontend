## 1. Container Version Bake-In

- [x] 1.1 Add Docker build/startup wiring to extract the current version from pyproject.toml and expose it as frontend runtime configuration.
- [x] 1.2 Verify container runtime includes the baked version value and define deterministic fallback when version metadata is missing.

## 2. Frontend Version Configuration

- [x] 2.1 Extend frontend configuration parsing to read the baked version field and normalize it for display.
- [x] 2.2 Add unit tests for version parsing and fallback behavior in configuration code.

## 3. Shell Footer Status Line

- [x] 3.1 Add a compact footer status line in the portal shell that displays the running version across top-level pages.
- [x] 3.2 Add UI tests to verify version rendering and unavailable fallback text in the shell layout.

## 4. End-to-End Validation

- [x] 4.1 Build and run the container locally to confirm the displayed version matches pyproject.toml.
- [x] 4.2 Run relevant frontend tests and document verification steps in the change notes.

### Verification Notes (2026-07-22)

- Container build: `docker build -t aqualog-frontend:version-check .`
- Container runtime validation:
	- Start: `docker run --rm -d --name aqualog-version-check -p 18080:8000 aqualog-frontend:version-check`
	- Check runtime config: `curl -sS http://127.0.0.1:18080/api/runtime-config`
	- Result: `{"AQUALOG_APP_VERSION":"1.6.0"}` (matches `pyproject.toml` version `1.6.0`)
	- Stop: `docker stop aqualog-version-check`
- Frontend tests: `npm test -- src/test/config.test.ts src/test/components/Shell.test.tsx`
	- Result: 2 test files passed, 10 tests passed.
