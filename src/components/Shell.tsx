import { Badge, Box, Button, Flex, HStack, Skeleton, Stack, Text, VStack } from '@chakra-ui/react'
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
    <Flex direction="column" minH="100dvh">
      {/* Header */}
      <Flex
        as="header"
        bg="bg.surface"
        borderBottomWidth="1px"
        borderBottomColor="border.subtle"
        px={4}
        py={3}
        position="sticky"
        top={0}
        zIndex={10}
        align="center"
        justify="space-between"
      >
        <Text fontWeight="bold" fontSize="lg" letterSpacing="tight">
          🐠 Aqualog
        </Text>
        {auth.isAuthenticated && (
          <HStack gap={2}>
            <Badge colorPalette="green" variant="subtle" borderRadius="full" px={2} py={0.5}>
              Authenticated
            </Badge>
            <Button size="xs" variant="ghost" onClick={() => void auth.signoutRedirect()}>
              Sign out
            </Button>
          </HStack>
        )}
      </Flex>

      {/* Main content */}
      <Box as="main" flex={1} px={4} pt={4} pb="80px" maxW="600px" w="full" mx="auto">
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
    <Stack gap={4} pt={2}>
      <Skeleton height="6" width="50%" rounded="md" />
      <Skeleton height="48" rounded="xl" />
      <Skeleton height="12" rounded="lg" />
    </Stack>
  )
}

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <VStack gap={4} pt={8} textAlign="center">
      <Text fontSize="2xl">⚠️</Text>
      <Text fontWeight="semibold" color="fg.default">
        Could not connect to the backend
      </Text>
      <Text color="fg.muted" fontSize="sm">
        {message}
      </Text>
      <Button onClick={onRetry} colorPalette="blue" variant="outline" size="sm">
        Retry
      </Button>
    </VStack>
  )
}
