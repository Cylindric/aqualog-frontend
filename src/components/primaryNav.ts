export interface PrimaryNavItem {
  to: string
  label: string
  icon: string
}

export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/calculator', label: 'Calculator', icon: '⚗️' },
  { to: '/aquariums', label: 'Aquariums', icon: '🐠' },
  { to: '/measurements', label: 'Measurements', icon: '🧂' },
]
