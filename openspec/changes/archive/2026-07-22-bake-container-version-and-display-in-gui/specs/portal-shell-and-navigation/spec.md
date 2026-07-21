## ADDED Requirements

### Requirement: Shell displays running version status
The system SHALL display a compact version status line in the application shell footer that is visible across top-level portal pages.

#### Scenario: Version status shown in shell layout
- **WHEN** a user views any top-level portal page
- **THEN** the shell renders a small footer status line showing the running application/container version with a `v` prefix

#### Scenario: Fallback shown when version is unavailable
- **WHEN** version metadata is unavailable or invalid
- **THEN** the shell footer displays an explicit unavailable status value instead of leaving the field blank
