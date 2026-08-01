import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from '../components/ui/provider'

const authMock = vi.fn()

vi.mock('react-oidc-context', () => ({
  useAuth: () => authMock(),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('../components/Shell', () => ({
  Shell: ({ children }: { children: ReactNode }) => <div data-testid="shell">{children}</div>,
}))

vi.mock('../pages/DashboardPage', () => ({
  DashboardPage: () => <div>Dashboard content</div>,
}))

vi.mock('../pages/CalculatorPage', () => ({ CalculatorPage: () => <div>Calculator</div> }))
vi.mock('../pages/AquariumsPage', () => ({ AquariumsPage: () => <div>Aquariums</div> }))
vi.mock('../pages/AquariumDetailPage', () => ({ AquariumDetailPage: () => <div>Aquarium detail</div> }))
vi.mock('../pages/MeasurementsPage', () => ({ MeasurementsPage: () => <div>Measurements</div> }))
vi.mock('../pages/ProfilePage', () => ({ ProfilePage: () => <div>Profile</div> }))
vi.mock('../pages/NotFoundPage', () => ({ NotFoundPage: () => <div>Not found</div> }))
vi.mock('../pages/AuthCallbackPage', () => ({ AuthCallbackPage: () => <div>Auth callback</div> }))

const configMock = {
  apiBaseUrl: 'http://localhost:8000',
  authMode: 'oauth' as 'oauth' | 'none',
  oidcAuthority: 'https://auth.example.com',
  oidcClientId: 'client',
  oidcRedirectUri: 'http://localhost/auth/callback',
  oidcPostLogoutRedirectUri: 'http://localhost',
  oidcScope: 'openid',
  appVersionDisplay: 'v1.0.0',
}

vi.mock('../config', () => ({
  config: configMock,
  isConfigured: () => true,
}))

describe('App auth gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    configMock.authMode = 'oauth'
  })

  it('renders application routes directly without a sign-in redirect when auth mode is none', async () => {
    configMock.authMode = 'none'
    const { default: App } = await import('../App')

    render(<App />, { wrapper: Provider })

    expect(await screen.findByText('Dashboard content')).toBeInTheDocument()
    expect(screen.getByTestId('shell')).toBeInTheDocument()
    expect(authMock).not.toHaveBeenCalled()
  })

  it('redirects to sign-in when auth mode is oauth and the user is unauthenticated', async () => {
    const signinRedirect = vi.fn()
    authMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      activeNavigator: undefined,
      error: undefined,
      signinRedirect,
    })

    const { default: App } = await import('../App')
    render(<App />, { wrapper: Provider })

    expect(await screen.findByText(/sending you to sign in/i)).toBeInTheDocument()
    expect(signinRedirect).toHaveBeenCalled()
  })

  it('renders application routes when auth mode is oauth and the user is authenticated', async () => {
    authMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      activeNavigator: undefined,
      error: undefined,
      user: { access_token: 'token' },
      signinRedirect: vi.fn(),
      signinSilent: vi.fn(),
    })

    const { default: App } = await import('../App')
    render(<App />, { wrapper: Provider })

    expect(await screen.findByText('Dashboard content')).toBeInTheDocument()
  })
})
