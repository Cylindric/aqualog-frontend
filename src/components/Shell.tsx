import {
  Anchor,
  Badge,
  Box,
  Button,
  Flex,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import type { CSSProperties, ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useReadinessCheck } from '../hooks/useReadinessCheck'
import { useAuth } from 'react-oidc-context'
import { config } from '../config'
import { useProfile } from '../features/profile/useProfile'
import { PRIMARY_NAV_ITEMS } from './primaryNav'

interface ShellProps {
  children: ReactNode
}

export function Shell({ children }: ShellProps) {
  const { state, errorMessage, retry } = useReadinessCheck()

  return (
    <Flex direction="column" h="100dvh" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <Flex
        component="header"
        bg="var(--mantine-color-body)"
        px="md"
        py="sm"
        pos="sticky"
        top={0}
        style={{ borderBottom: '1px solid var(--mantine-color-dark-4)' }}
        align="center"
        justify="space-between"
        wrap="wrap"
        gap="sm"
      >
        <Group gap="sm" wrap="nowrap" align="baseline">
          <Text fw={600} size="lg">
            AquaLog
          </Text>
          <Text c="dimmed" size="sm" visibleFrom="sm">
            Aquarium logging and tracking
          </Text>
        </Group>
        <AuthStatusBadge />
      </Flex>

      {/* Compact mobile navigation */}
      {state === 'ready' && <CompactPrimaryNav />}

      <Flex flex={1} mih={0} style={{ overflow: 'hidden' }}>
        {/* Single-column labeled rail on tablet and desktop */}
        {state === 'ready' && <DesktopNavRail />}

        {/* Main content, scrolls independently of the nav */}
        <Box
          component="main"
          flex={1}
          mih={0}
          h="100%"
          style={{ overflowY: 'auto' }}
        >
          <Box px="md" pt="md" pb="md" maw={900} w="100%" mx="auto">
            {state === 'loading' && <LoadingState />}
            {state === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}
            {state === 'ready' && children}
          </Box>
        </Box>
      </Flex>

      <Box
        component="footer"
        py="6px"
        px="md"
        ta="center"
        style={{ borderTop: '1px solid var(--mantine-color-dark-4)' }}
      >
        <Text size="xs" c="dimmed" data-testid="app-version-status">
          AquaLog &middot; {config.appVersionDisplay}
        </Text>
      </Box>
    </Flex>
  )
}

function AuthStatusBadge() {
  const { profile } = useProfile()

  if (!profile) {
    return null
  }

  const identity = profile.display_name ?? profile.username ?? undefined

  return (
    <Group gap="xs">
      <Badge color="accent" variant="light" radius="xl" px="xs" py="2px">
        {identity ? `Hi, ${identity}` : 'Authenticated'}
      </Badge>
      {config.authMode === 'oauth' && <SignOutButton />}
    </Group>
  )
}

function SignOutButton() {
  const auth = useAuth()

  return (
    <Button size="xs" variant="subtle" onClick={() => void auth.signoutRedirect()}>
      Sign out
    </Button>
  )
}

function navItemStyle(isActive: boolean): CSSProperties {
  return {
    background: isActive ? 'var(--mantine-color-accent-8)' : 'transparent',
    color: isActive ? 'var(--mantine-color-accent-1)' : 'var(--mantine-color-dark-3)',
    fontWeight: isActive ? 600 : 400,
  }
}

function DesktopNavRail() {
  return (
    <Stack
      component="nav"
      data-testid="desktop-nav-rail"
      visibleFrom="sm"
      gap={2}
      w={200}
      p="sm"
      h="100%"
      style={{
        borderRight: '1px solid var(--mantine-color-dark-4)',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <Text fw={600} size="10px" tt="uppercase" c="dimmed" px="xs" pb="6px" style={{ letterSpacing: '0.08em' }}>
        Navigation
      </Text>

      {PRIMARY_NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <Anchor
              component="span"
              underline="never"
              aria-current={isActive ? 'page' : undefined}
              px="10px"
              py="9px"
              style={{
                ...navItemStyle(isActive),
                borderRadius: 'var(--mantine-radius-md)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
              }}
            >
              {item.icon}
              <Text component="span" fw="inherit" fz="inherit" c="inherit">
                {item.label}
              </Text>
            </Anchor>
          )}
        </NavLink>
      ))}
    </Stack>
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
      style={{ borderBottom: '1px solid var(--mantine-color-dark-4)' }}
    >
      <ScrollArea type="never" scrollbarSize={0}>
        <Group gap="xs" wrap="nowrap">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavLink key={`compact-${item.to}`} to={item.to} end style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <Anchor
                  component="span"
                  underline="never"
                  aria-current={isActive ? 'page' : undefined}
                  px="sm"
                  py="6px"
                  style={{
                    ...navItemStyle(isActive),
                    background: isActive ? 'var(--mantine-color-accent-8)' : 'var(--mantine-color-dark-6)',
                    borderRadius: 'var(--mantine-radius-lg)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                  }}
                >
                  {item.icon}
                  <Text component="span" fz="inherit" fw="inherit" c="inherit" lh={1.1}>
                    {item.label}
                  </Text>
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
