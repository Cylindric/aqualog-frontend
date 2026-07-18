import {
  Anchor,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  ThemeIcon,
  Text,
} from '@mantine/core'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useReadinessCheck } from '../hooks/useReadinessCheck'
import { useAuth } from 'react-oidc-context'
import { PRIMARY_NAV_ITEMS } from './primaryNav'

interface ShellProps {
  children: ReactNode
}

export function Shell({ children }: ShellProps) {
  const { state, errorMessage, retry } = useReadinessCheck()
  const auth = useAuth()

  return (
    <Flex direction="column" mih="100dvh">
      {/* Header */}
      <Flex
        component="header"
        bg="var(--mantine-color-body)"
        px="md"
        py="sm"
        pos="sticky"
        top={0}
        style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
        align="center"
        justify="space-between"
      >
        <Group gap="sm" wrap="nowrap">
          <Text fw={700} size="lg">
            🐠 Aqualog
          </Text>
          <Text c="dimmed" size="sm" visibleFrom="sm">
            Aquarium Portal
          </Text>
        </Group>
        {auth.isAuthenticated && (
          <Group gap="xs">
            <Badge color="green" variant="light" radius="xl" px="xs" py="2px">
              Authenticated
            </Badge>
            <Button size="xs" variant="subtle" onClick={() => void auth.signoutRedirect()}>
              Sign out
            </Button>
          </Group>
        )}
      </Flex>

      {/* Compact mobile navigation */}
      {state === 'ready' && <CompactPrimaryNav />}

      <Flex flex={1} mih={0}>
        {/* Double navbar on tablet and desktop */}
        {state === 'ready' && <DesktopDoubleNavbar />}

        {/* Main content */}
        <Box component="main" flex={1} px="md" pt="md" pb="md" maw={900} w="100%" mx="auto">
          {state === 'loading' && <LoadingState />}
          {state === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}
          {state === 'ready' && children}
        </Box>
      </Flex>
    </Flex>
  )
}

function DesktopDoubleNavbar() {
  return (
    <Flex
      component="nav"
      data-testid="desktop-double-navbar"
      visibleFrom="sm"
      h="100%"
      style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}
    >
      <Stack gap="xs" p="sm" align="center" justify="start" style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink key={`icon-${item.to}`} to={item.to} end>
            {({ isActive }) => (
              <ThemeIcon
                variant={isActive ? 'filled' : 'light'}
                color={isActive ? 'blue' : 'gray'}
                radius="md"
                size={40}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Text lh={1}>{item.icon}</Text>
              </ThemeIcon>
            )}
          </NavLink>
        ))}
      </Stack>

      <Stack gap="xs" p="sm" w={220}>
        <Text fw={700} size="sm" c="dimmed" px="xs" pt="2px">
          Navigation
        </Text>
        <Divider mb="2px" />

        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink key={`label-${item.to}`} to={item.to} end>
            {({ isActive }) => (
              <Anchor
                component="span"
                aria-current={isActive ? 'page' : undefined}
                c={isActive ? 'blue.7' : 'var(--mantine-color-text)'}
                fw={isActive ? 700 : 500}
                px="sm"
                py="6px"
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                  background: isActive ? 'var(--mantine-color-blue-0)' : 'transparent',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                {item.label}
              </Anchor>
            )}
          </NavLink>
        ))}
      </Stack>
    </Flex>
  )
}

function CompactPrimaryNav() {
  return (
    <Box
      component="nav"
      data-testid="compact-primary-nav"
      hiddenFrom="sm"
      px="md"
      py="xs"
      style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
    >
      <ScrollArea type="never" scrollbarSize={0}>
        <Group gap="xs" wrap="nowrap">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavLink key={`compact-${item.to}`} to={item.to} end>
              {({ isActive }) => (
                <Anchor
                  component="span"
                  aria-current={isActive ? 'page' : undefined}
                  c={isActive ? 'blue.7' : 'var(--mantine-color-text)'}
                  fw={isActive ? 700 : 500}
                  px="sm"
                  py="6px"
                  style={{
                    borderRadius: 'var(--mantine-radius-lg)',
                    background: isActive ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-gray-0)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Text lh={1}>{item.icon}</Text>
                  <Text size="sm" lh={1.1}>{item.label}</Text>
                </Anchor>
              )}
            </NavLink>
          ))}
        </Group>
      </ScrollArea>
    </Box>
  )
}

function LoadingState() {
  return (
    <Stack gap="md" pt="xs">
      <Skeleton h="24px" w="50%" radius="md" />
      <Skeleton h="192px" radius="xl" />
      <Skeleton h="48px" radius="lg" />
    </Stack>
  )
}

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Stack gap="md" pt="xl" ta="center" align="center">
      <Text size="2rem">⚠️</Text>
      <Text fw={600}>
        Could not connect to the backend
      </Text>
      <Text c="dimmed" size="sm">
        {message}
      </Text>
      <Button onClick={onRetry} variant="outline" size="sm">
        Retry
      </Button>
    </Stack>
  )
}
