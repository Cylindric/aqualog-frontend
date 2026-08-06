import type { ReactNode } from 'react'

interface IconProps {
  size?: number
}

function Icon({ size = 18, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function IconDashboard(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </Icon>
  )
}

export function IconCalculator(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 2h6" />
      <path d="M10 2v6.7L4.7 18a2 2 0 0 0 1.7 3h11.2a2 2 0 0 0 1.7-3L14 8.7V2" />
      <path d="M7.3 15h9.4" />
    </Icon>
  )
}

export function IconAquariums(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 8c2 -2.2 4 -2.2 6 0s4 2.2 6 0 4 -2.2 6 0" />
      <path d="M2 14c2 -2.2 4 -2.2 6 0s4 2.2 6 0 4 -2.2 6 0" />
      <path d="M2 20c2 -2.2 4 -2.2 6 0s4 2.2 6 0 4 -2.2 6 0" />
    </Icon>
  )
}

export function IconMeasurements(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 15l4 -4 3 3 5 -6" />
    </Icon>
  )
}

export function IconProfile(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 19a6 6 0 0 1 11 0" />
    </Icon>
  )
}

export interface PrimaryNavItem {
  to: string
  label: string
  icon: ReactNode
}

// This file mixes icon components with nav-item data; splitting them out is
// tracked as a deferred follow-up in
// openspec/changes/refactor-page-hooks-eslint/tasks.md rather than done
// incidentally here (out of scope for this change).
// eslint-disable-next-line react-refresh/only-export-components
export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { to: '/calculator', label: 'Calculator', icon: <IconCalculator /> },
  { to: '/aquariums', label: 'Aquariums', icon: <IconAquariums /> },
  { to: '/measurements', label: 'Measurements', icon: <IconMeasurements /> },
  { to: '/profile', label: 'Profile', icon: <IconProfile /> },
]
