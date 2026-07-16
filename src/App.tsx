import { BrowserRouter, Route, Routes } from 'react-router'
import { Button, Heading, Stack, Text } from '@chakra-ui/react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'
import { Shell } from './components/Shell'
import { ConfigErrorPage } from './pages/ConfigErrorPage'
import { CalculatorPage } from './pages/CalculatorPage'
import { DashboardPage } from './pages/DashboardPage'
import { AquariumsPage } from './pages/AquariumsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { isConfigured } from './config'
import { AuthTokenBridge } from './auth/OidcProvider'
import { AuthCallbackPage } from './pages/AuthCallbackPage'

export default function App() {
  if (!isConfigured()) {
    return <ConfigErrorPage />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<AuthenticatedApp />} />
      </Routes>
    </BrowserRouter>
  )
}

function AuthenticatedApp() {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
      void auth.signinRedirect()
    }
  }, [auth])

  if (
    auth.isLoading ||
    auth.activeNavigator === 'signinRedirect' ||
    auth.activeNavigator === 'signinSilent' ||
    auth.activeNavigator === 'signoutRedirect'
  ) {
    return <AuthStatus title="Checking your session" body="Authenticating with provider..." />
  }

  if (auth.error) {
    return (
      <AuthStatus
        title="Authentication failed"
        body={auth.error.message}
        action={
          <Button colorPalette="blue" onClick={() => void auth.signinRedirect()}>
            Sign in again
          </Button>
        }
      />
    )
  }

  if (!auth.isAuthenticated) {
    return <AuthStatus title="Redirecting" body="Sending you to sign in..." />
  }

  return (
    <>
      <AuthTokenBridge />
      <Shell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/aquariums" element={<AquariumsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Shell>
    </>
  )
}

interface AuthStatusProps {
  title: string
  body: string
  action?: ReactNode
}

function AuthStatus({ title, body, action }: AuthStatusProps) {
  return (
    <Stack maxW="480px" mx="auto" mt={12} px={6} gap={4}>
      <Heading size="md">{title}</Heading>
      <Text color="fg.muted" fontSize="sm">
        {body}
      </Text>
      {action}
    </Stack>
  )
}
