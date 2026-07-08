# Copilot Instructions

## Build, test, and lint commands

- This repository does not currently include a checked-in application build, test, or lint suite.
- `mise.toml` defines the local toolchain: Python 3.11, `uv`, and `ruff`.
- `mise run install` (or `mise i`) is the only declared task and runs `uv pip install -r requirements.txt`; treat it as optional bootstrap wiring, since no `requirements.txt` is currently checked in.

## High-level architecture

- This repository is an OpenSpec/Copilot workflow repo, not a conventional frontend app despite the directory name. Most changes here are markdown and config updates.
- `.github/prompts/opsx-*.prompt.md` defines the user-facing slash-command workflows in the `opsx` namespace: `propose`, `apply`, `explore`, `sync`, and `archive`.
- `.github/skills/openspec-*/SKILL.md` contains the skill-packaged versions of those same workflows. They mirror the prompt files but add skill metadata front matter and should stay behaviorally aligned with the corresponding prompt.
- `openspec/config.yaml` sets the repository to the `spec-driven` OpenSpec schema and is the place to add shared project context or per-artifact rules that should influence generated proposal/design/spec/task artifacts.
- `.agents/skills/chakra-ui-*` plus `skills-lock.json` are vendored custom agent skills pulled from upstream sources; treat them as separate from the OpenSpec prompt workflow unless the task is specifically about those skills.

## Key conventions

- Use the `opsx` slash-command namespace in examples and instructions: `/opsx:propose`, `/opsx:apply`, `/opsx:explore`, `/opsx:sync`, `/opsx:archive`.
- Preserve the store-aware OpenSpec CLI pattern used throughout the repo: resolve store ids with `openspec store list --json`, and pass `--store <id>` only to commands that read or write specs and changes.
- Prefer `openspec ... --json` command forms and derive paths from CLI output fields such as `planningHome`, `changeRoot`, `artifactPaths`, `actionContext`, and `contextFiles` instead of hardcoding repo-local paths when authoring or editing workflow instructions.
- Keep paired prompt and skill files in sync when changing workflow behavior, guardrails, examples, or command sequences. A workflow change is usually incomplete if only `.github/prompts/...` or only `.github/skills/...` was updated.
- Respect each workflow's boundary:
  - `explore` is for investigation and artifact authoring, never implementation.
  - `propose` creates proposal/design/tasks artifacts until the change is ready for implementation.
  - `apply` implements tasks and updates task checkboxes.
  - `sync` merges delta specs into main specs intelligently rather than copying files wholesale.
  - `archive` checks artifact/task completion, evaluates delta spec sync state, and archives the change directory under a date-prefixed name.
- Skill files use full YAML front matter with metadata; prompt files use a minimal front matter block. Match the existing format when editing either type.
