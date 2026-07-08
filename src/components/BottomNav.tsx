import { Box, Flex, Text } from '@chakra-ui/react'
import { NavLink } from 'react-router'

interface NavItem {
  to: string
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Calculator', icon: '⚗️' },
]

export function BottomNav() {
  return (
    <Box
      as="nav"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="bg.surface"
      borderTopWidth="1px"
      borderTopColor="border.subtle"
    >
      <Flex h="16" justify="space-around" align="center">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end>
            {({ isActive }) => (
              <Flex
                direction="column"
                align="center"
                gap={0.5}
                px={4}
                py={1}
                color={isActive ? 'colorPalette.500' : 'fg.muted'}
                colorPalette="blue"
                transition="color 0.15s"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Text fontSize="xl" lineHeight="1">{item.icon}</Text>
                <Text fontSize="xs" fontWeight={isActive ? 'semibold' : 'normal'}>
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
