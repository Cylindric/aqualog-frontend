# frontend-lint-tooling Specification

## Purpose
Define requirements for the frontend project's ESLint tooling: how lint is run, what correctness and Fast Refresh rules it enforces, how it parses TypeScript/TSX given this project's unsupported-by-typescript-eslint TypeScript version, and the expectation that the committed source tree lints clean.

## Requirements

### Requirement: Frontend project provides a runnable lint command
The frontend project SHALL provide an `npm run lint` script that runs ESLint against the `src/` TypeScript/TSX source tree using a flat `eslint.config.js` configuration.

#### Scenario: Running lint locally
- **WHEN** a developer runs `npm run lint` from `frontend/`
- **THEN** ESLint executes against the project's TypeScript and TSX source files and exits with a non-zero status if any violation is found, or zero if none are found

### Requirement: Lint configuration enforces React Hooks correctness rules
The ESLint configuration SHALL include `eslint-plugin-react-hooks`'s recommended rules (including `rules-of-hooks` and `exhaustive-deps`) so that incorrect hook usage and missing/incorrect `useEffect`/`useCallback`/`useMemo` dependencies are flagged.

#### Scenario: Effect with a missing dependency
- **WHEN** a component defines a `useEffect` (or `useCallback`/`useMemo`) that references a value not listed in its dependency array
- **THEN** running `npm run lint` reports an `exhaustive-deps` violation for that hook call

### Requirement: Lint configuration parses TypeScript/TSX syntax and enforces general JS-correctness rules
The ESLint configuration SHALL parse `.ts`/`.tsx` files (including TSX generics and type annotations) and apply `@eslint/js`'s recommended rule set plus `no-duplicate-imports` to them. Type-aware linting is explicitly out of scope for this requirement — TypeScript's own compiler (`tsc -b`, run by `npm run build`, with `strict`/`noUnusedLocals`/`noUnusedParameters` enabled) is the source of truth for type correctness and unused-symbol detection; ESLint's own `no-unused-vars` and `no-undef` SHALL be disabled for `.ts`/`.tsx` files to avoid false positives on TS-only syntax (interfaces, generics, type-only imports) that a non-type-aware parser cannot distinguish from real references.

#### Scenario: Duplicate import from the same module
- **WHEN** a `.ts` or `.tsx` file imports two separate value bindings from the same module in two separate `import` statements (not a type/value split)
- **THEN** running `npm run lint` reports a `no-duplicate-imports` violation for that file

#### Scenario: TSX generic syntax parses without error
- **WHEN** a `.tsx` file uses TypeScript-specific syntax (interfaces, generics, `import type`, type annotations)
- **THEN** running `npm run lint` parses the file successfully and does not report parse errors or false-positive `no-undef`/`no-unused-vars` violations for type-only constructs

### Requirement: TypeScript-aware (`typescript-eslint`) linting is deferred until upstream supports this project's TypeScript version
As of this capability's introduction, this project's `typescript` version is not supported by any published `typescript-eslint` release (tracked upstream at [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)). The lint configuration SHALL NOT depend on `typescript-eslint` while that remains true, and this is a deliberate, documented gap rather than an oversight.

#### Scenario: typescript-eslint unavailable
- **WHEN** `typescript-eslint` is installed and run against this project's `typescript` version
- **THEN** it fails to initialize (confirmed: `typescript-eslint does not support TS 7.0.`), which is why the lint configuration uses `@babel/eslint-parser` instead for `.ts`/`.tsx` parsing

### Requirement: Lint configuration enforces React Fast Refresh compatibility
The ESLint configuration SHALL include `eslint-plugin-react-refresh`'s recommended rule for Vite's React Fast Refresh, flagging component files that export non-component values in a way that breaks fast refresh.

#### Scenario: Component module with a non-component named export
- **WHEN** a file that exports a React component also exports an unrelated non-component value (e.g. a plain constant or utility function) in a way that breaks fast-refresh boundaries
- **THEN** running `npm run lint` reports a `react-refresh` violation for that file

### Requirement: The existing source tree passes lint clean
The `src/` tree SHALL have zero ESLint violations under the new configuration at the time this capability is introduced.

#### Scenario: Lint run against the committed codebase
- **WHEN** `npm run lint` is run against the repository as committed after this capability is added
- **THEN** it exits with status zero and reports no violations
