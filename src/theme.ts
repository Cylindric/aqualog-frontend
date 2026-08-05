import { Button, createTheme, type MantineColorsTuple } from '@mantine/core'

// Tokens adapted from the "Nocturne" design system
// (Claude Design project "AquaLog UI mockups" / AquaLog Redesign.dc.html).
// Colors, radius and shadows are ported; the deck-oriented --space-* scale
// is not — Mantine's default spacing scale already fits this app's layout.

const accent: MantineColorsTuple = [
  '#f5f4ff', // 0 — accent-100
  '#e7e5fe', // 1 — accent-200
  '#d2cefd', // 2 — accent-300
  '#b5abfc', // 3 — accent-400
  '#968ae0', // 4 — accent-500
  '#9184d9', // 5 — --color-accent (base/primary shade)
  '#796cbf', // 6 — accent-600
  '#5d5294', // 7 — accent-700
  '#423a6a', // 8 — accent-800
  '#2b2741', // 9 — accent-900
]

// Overrides Mantine's built-in dark palette so the app's dark scheme
// resolves to Nocturne's ground (--color-bg/--color-surface) and neutral
// ramp instead of Mantine's defaults.
const dark: MantineColorsTuple = [
  '#e9e9ed', // 0 — --color-text
  '#e4e7f5', // 1 — neutral-200
  '#cfd3e5', // 2 — neutral-300 (dimmed text)
  '#b2b6ca', // 3 — neutral-400
  '#383946', // 4 — --color-divider flattened onto --color-bg (borders)
  '#3f424d', // 5 — neutral-800 (hover)
  '#232532', // 6 — --color-surface (cards, inputs, default button bg)
  '#161826', // 7 — --color-bg (body)
  '#292b31', // 8 — neutral-900
  '#12141f', // 9 — deepest (overlays)
]

export const theme = createTheme({
  primaryColor: 'accent',
  primaryShade: { light: 5, dark: 5 },
  colors: { accent, dark },
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '500',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '14px',
  },
  defaultRadius: 'md',
  shadows: {
    sm: '0 0 0 1px #3f424d',
    md: '0 0 0 1px #595d6c, 0 6px 18px rgba(0, 0, 0, 0.55)',
    lg: '0 0 0 1px #9397ab, 0 16px 40px rgba(0, 0, 0, 0.65)',
  },
  components: {
    // Nocturne rule: primary actions are an accent outline, never a fill.
    Button: Button.extend({ defaultProps: { variant: 'outline' } }),
  },
})
