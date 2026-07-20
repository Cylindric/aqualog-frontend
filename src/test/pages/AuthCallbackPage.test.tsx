import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { Provider } from '../../components/ui/provider'
import { AuthCallbackPage } from '../../pages/AuthCallbackPage'

const authMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('react-oidc-context', () => ({
  useAuth: () => authMock(),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <Provider>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  )
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      activeNavigator: undefined,
      error: undefined,
      signinRedirect: vi.fn(),
    })
  })

  it('renders loading state while callback authentication is in progress', () => {
    authMock.mockReturnValueOnce({
      isAuthenticated: false,
      isLoading: true,
      activeNavigator: 'signinRedirect',
      error: undefined,
      signinRedirect: vi.fn(),
    })

    render(<AuthCallbackPage />, { wrapper: Wrapper })

    expect(screen.getByText(/signing you in/i)).toBeInTheDocument()
    expect(screen.getByText(/completing authentication/i)).toBeInTheDocument()
  })

  it('shows actionable provider guidance for policy-denied callback errors', async () => {
    const user = userEvent.setup()
    const signinRedirect = vi.fn()

    authMock.mockReturnValueOnce({
      isAuthenticated: false,
      isLoading: false,
      activeNavigator: undefined,
      error: { message: 'access_denied: signup disabled' },
      signinRedirect,
    })

    render(<AuthCallbackPage />, { wrapper: Wrapper })

    expect(screen.getByText(/authentication could not be completed/i)).toBeInTheDocument()
    expect(screen.getByText(/contact your administrator/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try sign-in again/i }))
    expect(signinRedirect).toHaveBeenCalledTimes(1)
  })

  it('keeps generic callback errors visible for troubleshooting', () => {
    authMock.mockReturnValueOnce({
      isAuthenticated: false,
      isLoading: false,
      activeNavigator: undefined,
      error: { message: 'temporarily_unavailable' },
      signinRedirect: vi.fn(),
    })

    render(<AuthCallbackPage />, { wrapper: Wrapper })

    expect(screen.getByText('temporarily_unavailable')).toBeInTheDocument()
  })

  it('shows authentication-required fallback and sign-in action when session is absent', async () => {
    const user = userEvent.setup()
    const signinRedirect = vi.fn()

    authMock.mockReturnValueOnce({
      isAuthenticated: false,
      isLoading: false,
      activeNavigator: undefined,
      error: undefined,
      signinRedirect,
    })

    render(<AuthCallbackPage />, { wrapper: Wrapper })

    expect(screen.getByText(/authentication required/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(signinRedirect).toHaveBeenCalledTimes(1)
  })
})
