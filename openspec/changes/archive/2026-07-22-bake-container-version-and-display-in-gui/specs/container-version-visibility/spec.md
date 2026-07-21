## ADDED Requirements

### Requirement: Container image includes frontend-visible application version
The system SHALL extract the current semantic version from pyproject.toml during container image build and make that version available to the frontend runtime configuration.

#### Scenario: Version baked into image from project metadata
- **WHEN** a container image is built from a source revision that includes pyproject.toml
- **THEN** the image runtime configuration includes the same version value declared in pyproject.toml

#### Scenario: Built image exposes immutable version metadata
- **WHEN** the container starts
- **THEN** the frontend can read the baked version value without requiring backend API calls

### Requirement: Version metadata has explicit fallback semantics
The system SHALL provide a deterministic fallback when the baked version is missing or invalid so the frontend can render a stable status value.

#### Scenario: Missing version metadata
- **WHEN** runtime configuration does not provide a valid baked version value
- **THEN** the system returns a fallback status value indicating the version is unavailable

#### Scenario: Local development without baked metadata
- **WHEN** the application runs in non-container local development and baked version metadata is not present
- **THEN** the system returns the same fallback status value used in container runtime for missing metadata
