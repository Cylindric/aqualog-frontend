import {
  Badge,
  Box,
  Button,
  Flex,
  Group,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { useReadinessCheck } from '../hooks/useReadinessCheck'
import { useAuth } from 'react-oidc-context'

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
        <Text fw={700} size="lg">
          🐠 Aqualog
        </Text>
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

      {/* Main content */}
      <Box component="main" flex={1} px="md" pt="md" pb="80px" maw={600} w="100%" mx="auto">
        {state === 'loading' && <LoadingState />}
        {state === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}
        {state === 'ready' && children}
      </Box>

      {/* Bottom navigation */}
      {state === 'ready' && <BottomNav />}
    </Flex>
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
