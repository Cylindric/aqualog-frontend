import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { Provider } from '../../components/ui/provider'
import { Shell } from '../../components/Shell'
import { config } from '../../config'

const readinessMock = vi.fn()
const authMock = vi.fn()
const profileMock = vi.fn()

vi.mock('../../hooks/useReadinessCheck', () => ({
  useReadinessCheck: () => readinessMock(),
}))

vi.mock('react-oidc-context', () => ({
  useAuth: () => authMock(),
}))

vi.mock('../../features/profile/useProfile', () => ({
  useProfile: () => profileMock(),
}))

function Wrapper({ children, initialPath = '/dashboard' }: { children: ReactNode; initialPath?: string }) {
  return (
    <Provider>
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    </Provider>
  )
}

function renderShell(initialPath = '/dashboard') {
  return render(
    <Shell>
      <div>Page content</div>
    </Shell>,
    {
      wrapper: ({ children }) => <Wrapper initialPath={initialPath}>{children}</Wrapper>,
    },
  )
}

beforeEach(() => {
  config.appVersionDisplay = 'v1.6.0'
  config.authMode = 'oauth'

  readinessMock.mockReturnValue({
    state: 'ready',
    errorMessage: '',
    retry: vi.fn(),
  })

  authMock.mockReturnValue({
    isAuthenticated: true,
    signoutRedirect: vi.fn(),
  })

  profileMock.mockReturnValue({
    profile: {
      id: 'user-1',
      username: null,
      display_name: null,
      bio: null,
      created_at: '',
      updated_at: '',
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    save: vi.fn(),
  })
})

describe('Shell navigation layout', () => {
  it('renders desktop and compact primary nav containers', () => {
    renderShell('/dashboard')

    expect(screen.getByTestId('desktop-nav-rail')).toBeInTheDocument()
    expect(screen.getByTestId('compact-primary-nav')).toBeInTheDocument()
  })

  it('marks active destination in desktop and compact navigation', () => {
    renderShell('/calculator')

    const desktopNav = screen.getByTestId('desktop-nav-rail')
    const compactNav = screen.getByTestId('compact-primary-nav')

    const desktopCalculator = within(desktopNav)
      .getAllByRole('link', { name: /calculator/i })
      .find((node) => node.getAttribute('aria-current') === 'page')
    const compactCalculator = within(compactNav).getByRole('link', { name: /calculator/i })

    expect(desktopCalculator).toHaveAttribute('aria-current', 'page')
    expect(compactCalculator).toHaveAttribute('aria-current', 'page')
  })

  it('renders loading state without navigation', () => {
    readinessMock.mockReturnValueOnce({
      state: 'loading',
      errorMessage: '',
      retry: vi.fn(),
    })
    renderShell('/dashboard')

    expect(screen.queryByTestId('desktop-nav-rail')).not.toBeInTheDocument()
    expect(screen.queryByTestId('compact-primary-nav')).not.toBeInTheDocument()
  })

  it('renders error state with retry affordance', () => {
    readinessMock.mockReturnValueOnce({
      state: 'error',
      errorMessage: 'boom',
      retry: vi.fn(),
    })
    renderShell('/dashboard')
    expect(screen.getByText(/could not connect to the backend/i)).toBeInTheDocument()
  })

  it('renders version status line with v-prefixed value', () => {
    renderShell('/dashboard')

    expect(screen.getByTestId('app-version-status')).toHaveTextContent('AquaLog · v1.6.0')
  })

  it('renders unavailable fallback in status line', () => {
    config.appVersionDisplay = 'unavailable'
    renderShell('/dashboard')

    expect(screen.getByTestId('app-version-status')).toHaveTextContent('AquaLog · unavailable')
  })

  it('includes a profile navigation entry', () => {
    renderShell('/dashboard')

    const desktopNav = screen.getByTestId('desktop-nav-rail')
    const compactNav = screen.getByTestId('compact-primary-nav')

    expect(within(desktopNav).getAllByRole('link', { name: /profile/i }).length).toBeGreaterThan(0)
    expect(within(compactNav).getByRole('link', { name: /profile/i })).toBeInTheDocument()
  })

  it('shows the app-sourced username in the authenticated badge', () => {
    profileMock.mockReturnValue({
      profile: {
        id: 'user-1',
        username: 'fishkeeper42',
        display_name: null,
        bio: null,
        created_at: '',
        updated_at: '',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      save: vi.fn(),
    })
    renderShell('/dashboard')

    expect(screen.getByText('Hi, fishkeeper42')).toBeInTheDocument()
  })

  it('prefers display name over username in the authenticated badge', () => {
    profileMock.mockReturnValue({
      profile: {
        id: 'user-1',
        username: 'fishkeeper42',
        display_name: 'Fish Keeper',
        bio: null,
        created_at: '',
        updated_at: '',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      save: vi.fn(),
    })
    renderShell('/dashboard')

    expect(screen.getByText('Hi, Fish Keeper')).toBeInTheDocument()
  })

  it('falls back to plain Authenticated badge when no username or display name is present', () => {
    renderShell('/dashboard')

    expect(screen.getByText('Authenticated')).toBeInTheDocument()
  })

  it('hides the identity badge while the profile has not loaded', () => {
    profileMock.mockReturnValue({
      profile: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      save: vi.fn(),
    })
    renderShell('/dashboard')

    expect(screen.queryByText(/authenticated/i)).not.toBeInTheDocument()
  })

  it('shows the identity badge but hides sign-out when auth mode is none', () => {
    config.authMode = 'none'
    authMock.mockClear()
    profileMock.mockReturnValue({
      profile: {
        id: 'user-1',
        username: 'fishkeeper42',
        display_name: null,
        bio: null,
        created_at: '',
        updated_at: '',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      save: vi.fn(),
    })
    renderShell('/dashboard')

    expect(screen.getByText('Hi, fishkeeper42')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
    expect(authMock).not.toHaveBeenCalled()
  })
})
