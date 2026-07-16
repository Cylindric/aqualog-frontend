import { Box, Flex, Text } from '@mantine/core'
import { NavLink } from 'react-router'

interface NavItem {
  to: string
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/calculator', label: 'Calculator', icon: '⚗️' },
  { to: '/aquariums', label: 'Aquariums', icon: '🐠' },
]

export function BottomNav() {
  return (
    <Box
      component="nav"
      pos="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="var(--mantine-color-body)"
      style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
    >
      <Flex h="64px" justify="space-around" align="center">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end>
            {({ isActive }) => (
              <Flex
                direction="column"
                align="center"
                gap="2px"
                px="md"
                py="4px"
                c={isActive ? 'blue.6' : 'dimmed'}
                style={{ transition: 'color 0.15s' }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Text size="xl" lh={1}>{item.icon}</Text>
                <Text size="xs" fw={isActive ? 600 : 400}>
                  {item.label}
                </Text>
              </Flex>
            )}
          </NavLink>
        ))}
      </Flex>
    </Box>
  )
}
