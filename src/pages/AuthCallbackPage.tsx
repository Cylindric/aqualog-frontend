import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router'

export function AuthCallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [auth.isAuthenticated, navigate])

  if (auth.isLoading || auth.activeNavigator === 'signinRedirect') {
    return <AuthMessage title="Signing you in" body="Completing authentication..." />
  }

  if (auth.error) {
    return (
      <AuthMessage
        title="Sign-in failed"
        body={auth.error.message}
        actions={
          <Button colorPalette="blue" onClick={() => void auth.signinRedirect()}>
            Try sign-in again
          </Button>
        }
      />
    )
  }

  return (
    <AuthMessage
      title="Authentication required"
      body="Your session could not be restored from the callback URL."
      actions={
        <Button colorPalette="blue" onClick={() => void auth.signinRedirect()}>
          Sign in
        </Button>
      }
    />
  )
}

interface AuthMessageProps {
  title: string
  body: string
  actions?: ReactNode
}

function AuthMessage({ title, body, actions }: AuthMessageProps) {
  return (
    <Box maxW="480px" mx="auto" mt={12} px={6}>
      <Stack gap={4}>
        <Heading size="md">{title}</Heading>
        <Text color="fg.muted" fontSize="sm">
          {body}
        </Text>
        {actions}
      </Stack>
    </Box>
  )
}
