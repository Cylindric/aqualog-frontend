import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { Provider } from '../../../components/ui/provider'
import { ProfileView } from '../../../features/profile/ProfileView'
import { getMyProfile, updateMyProfile } from '../../../api/profile'

vi.mock('../../../api/profile', () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}))

vi.mock('../../../config', () => ({
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
const updateMyProfileMock = vi.mocked(updateMyProfile)

const baseProfile = {
  id: 'user-1',
  username: 'reefer',
  display_name: 'Reefer',
  bio: null,
  created_at: '2026-07-18T10:00:00Z',
  updated_at: '2026-07-18T10:00:00Z',
  groups: [],
}

function renderView() {
  return render(<ProfileView />, { wrapper: Wrapper })
}

beforeEach(() => {
  vi.clearAllMocks()
  getMyProfileMock.mockResolvedValue(baseProfile)
  updateMyProfileMock.mockResolvedValue(baseProfile)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProfileView', () => {
  it('loads and displays the current profile', async () => {
    renderView()

    expect(await screen.findByText('reefer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Reefer')).toBeInTheDocument()
  })

  it('shows a validation error and blocks submit when display name is cleared', async () => {
    const user = userEvent.setup()
    renderView()

    const input = await screen.findByLabelText('Display name')
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Display name is required')).toBeInTheDocument()
    expect(updateMyProfileMock).not.toHaveBeenCalled()
  })

  it('shows an updated display name and success message after a successful save', async () => {
    const user = userEvent.setup()
    updateMyProfileMock.mockResolvedValue({ ...baseProfile, display_name: 'New Name' })
    renderView()

    const input = await screen.findByLabelText('Display name')
    await user.clear(input)
    await user.type(input, 'New Name')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateMyProfileMock).toHaveBeenCalledWith({ display_name: 'New Name' }))
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(screen.getByDisplayValue('New Name')).toBeInTheDocument()
  })

  it('keeps the unsaved edit and shows an error when save fails', async () => {
    const user = userEvent.setup()
    updateMyProfileMock.mockRejectedValue(new Error('boom'))
    renderView()

    const input = await screen.findByLabelText('Display name')
    await user.clear(input)
    await user.type(input, 'Attempted Name')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Could not save changes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Attempted Name')).toBeInTheDocument()
  })
})
