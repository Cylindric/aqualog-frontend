import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// NOTE: this project uses TypeScript 7 (the native/Go-based compiler), which
// typescript-eslint does not support yet (github.com/typescript-eslint/typescript-eslint/issues/10940
// — it's an architecture gap, not a version-pinning issue, and maintainers
// don't offer a workaround). Until that lands, TS/TSX files are parsed with
// @babel/eslint-parser (syntax-only, no type information) instead of
// @typescript-eslint/parser. That means TS-type-aware rules aren't available
// here — type correctness is already fully covered by `tsc -b` in `npm run
// build` (tsconfig has `strict`, `noUnusedLocals`, `noUnusedParameters`), so
// this config focuses on what tsc doesn't check: React Hooks correctness,
// Fast Refresh compatibility, and general JS-level mistakes.
export default [
  {
    // Everything not under src/ is generated output (dist/, artifacts/,
    // coverage/, playwright-report/, test-results/), vendored deps, or a
    // separate toolchain (backend/ is Python, tests/ is a standalone
    // Playwright project) — scope linting to the app source tree only, and
    // restrict every rule block below to it with a matching `files` glob so
    // a bare `eslint .` can't accidentally pick up a minified bundle.
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
      parser: (await import('@babel/eslint-parser')).default,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react', '@babel/preset-typescript'],
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      'no-duplicate-imports': 'error',
      // tsc -b (noUnusedLocals/noUnusedParameters) already catches unused
      // vars/imports with full type awareness; the Babel parser strips
      // TS-only constructs (type-only imports, interfaces) before ESLint
      // sees them, which makes its own no-unused-vars produce false
      // positives on otherwise-used type imports.
      'no-unused-vars': 'off',
      // Same reasoning as no-unused-vars: core no-undef has no concept of TS
      // type positions (interfaces, generics, type-only imports) and flags
      // every type name as an undefined variable. tsc already catches truly
      // undefined identifiers with full type awareness.
      'no-undef': 'off',
    },
  },
]
