import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from '../../components/ui/provider'
import { ProfilePage } from '../../pages/ProfilePage'
import { getMyProfile } from '../../api/profile'

vi.mock('../../api/profile', () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}))

vi.mock('../../config', () => ({
  config: {
    apiBaseUrl: 'http://localhost:8000',
    oidcAuthority: 'https://auth.example.com/application/o/aqualog/',
    oidcClientId: 'frontend-test-replace-with-aqualog-spa-client-id',
    oidcRedirectUri: 'http://localhost:5173/auth/callback',
    oidcPostLogoutRedirectUri: 'http://localhost:5173',
    oidcScope: 'openid profile email',
  },
  hasOidcConfig: () => true,
  isConfigured: () => true,
  configErrors: () => [],
  loadRuntimeConfig: async () => {},
}))

function Wrapper({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}

const getMyProfileMock = vi.mocked(getMyProfile)

beforeEach(() => {
  vi.clearAllMocks()
  getMyProfileMock.mockResolvedValue({
    id: 'user-1',
    username: 'reefer',
    display_name: 'Reefer',
    bio: null,
    created_at: '2026-07-18T10:00:00Z',
    updated_at: '2026-07-18T10:00:00Z',
    groups: [],
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProfilePage', () => {
  it('renders the profile page with title and profile data', async () => {
    render(<ProfilePage />, { wrapper: Wrapper })

    expect(screen.getByRole('heading', { name: 'My Profile' })).toBeInTheDocument()
    expect(await screen.findByText('reefer')).toBeInTheDocument()
  })
})
