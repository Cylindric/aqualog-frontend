import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { Provider } from '../../components/ui/provider'
import { Shell } from '../../components/Shell'

const readinessMock = vi.fn()
const authMock = vi.fn()

vi.mock('../../hooks/useReadinessCheck', () => ({
  useReadinessCheck: () => readinessMock(),
}))

vi.mock('react-oidc-context', () => ({
  useAuth: () => authMock(),
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
  readinessMock.mockReturnValue({
    state: 'ready',
    errorMessage: '',
    retry: vi.fn(),
  })

  authMock.mockReturnValue({
    isAuthenticated: true,
    signoutRedirect: vi.fn(),
  })
})

describe('Shell navigation layout', () => {
  it('renders desktop and compact primary nav containers', () => {
    renderShell('/dashboard')

    expect(screen.getByTestId('desktop-double-navbar')).toBeInTheDocument()
    expect(screen.getByTestId('compact-primary-nav')).toBeInTheDocument()
  })

  it('marks active destination in desktop and compact navigation', () => {
    renderShell('/calculator')

    const desktopNav = screen.getByTestId('desktop-double-navbar')
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

    expect(screen.queryByTestId('desktop-double-navbar')).not.toBeInTheDocument()
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
})
