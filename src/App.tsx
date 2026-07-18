import { BrowserRouter, Route, Routes } from 'react-router'
import { Button, Stack, Text, Title } from '@mantine/core'
import { Suspense, lazy, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'
import { Shell } from './components/Shell'
import { ConfigErrorPage } from './pages/ConfigErrorPage'
import { isConfigured } from './config'
import { AuthTokenBridge } from './auth/OidcProvider'

const AuthCallbackPage = lazy(() =>
  import('./pages/AuthCallbackPage').then((module) => ({ default: module.AuthCallbackPage })),
)

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)

const CalculatorPage = lazy(() =>
  import('./pages/CalculatorPage').then((module) => ({ default: module.CalculatorPage })),
)

const AquariumsPage = lazy(() =>
  import('./pages/AquariumsPage').then((module) => ({ default: module.AquariumsPage })),
)

const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

export default function App() {
  if (!isConfigured()) {
    return <ConfigErrorPage />
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<AuthStatus title="Loading" body="Loading application..." />}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
      </Suspense>
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
          <Button onClick={() => void auth.signinRedirect()}>
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
    <Stack gap="md" maw={480} mx="auto" mt="xl" px="md">
      <Title order={3}>{title}</Title>
      <Text c="dimmed" size="sm">
        {body}
      </Text>
      {action}
    </Stack>
  )
}
