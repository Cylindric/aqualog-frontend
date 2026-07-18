import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { Provider } from '../../components/ui/provider'
import { AquariumsPage } from '../../pages/AquariumsPage'
import {
  createAquarium,
  deleteAquarium,
  listAquariums,
  updateAquarium,
} from '../../api/aquariums'

vi.mock('../../api/aquariums', () => ({
  listAquariums: vi.fn(),
  createAquarium: vi.fn(),
  updateAquarium: vi.fn(),
  deleteAquarium: vi.fn(),
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

const listAquariumsMock = vi.mocked(listAquariums)
const createAquariumMock = vi.mocked(createAquarium)
const updateAquariumMock = vi.mocked(updateAquarium)
const deleteAquariumMock = vi.mocked(deleteAquarium)

function renderPage() {
  return render(<AquariumsPage />, { wrapper: Wrapper })
}

beforeEach(() => {
  vi.clearAllMocks()

  listAquariumsMock.mockResolvedValue([
    {
      id: 'aq-1',
      name: 'Living Room Reef',
      type: 'Saltwater Reef',
      volumeLiters: 280,
      createdAt: '2026-07-18T10:00:00Z',
      updatedAt: '2026-07-18T10:00:00Z',
    },
  ])
  createAquariumMock.mockResolvedValue({
    id: 'aq-2',
    name: 'Office Nano',
    type: 'Saltwater FOWLR',
    volumeLiters: 76,
    createdAt: '2026-07-18T11:00:00Z',
    updatedAt: '2026-07-18T11:00:00Z',
  })
  updateAquariumMock.mockResolvedValue({
    id: 'aq-1',
    name: 'Living Room Reef Updated',
    type: 'Saltwater Reef',
    volumeLiters: 300,
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-18T12:00:00Z',
  })
  deleteAquariumMock.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AquariumsPage', () => {
  it('loads aquarium records and renders rows', async () => {
    renderPage()

    expect(screen.getByRole('button', { name: /add aquarium/i })).toBeDisabled()
    await screen.findByText('Living Room Reef')

    expect(listAquariumsMock).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /add aquarium/i })).toBeEnabled()
  })

  it('creates a record through API and shows it in the table', async () => {
    const user = userEvent.setup()
    listAquariumsMock.mockResolvedValueOnce([])
    renderPage()

    await screen.findByText(/no aquariums yet/i)
    await user.click(screen.getByRole('button', { name: /^add aquarium$/i }))

    const nameInput = await screen.findByLabelText(/aquarium name/i)
    await user.type(nameInput, 'Office Nano')
    await user.type(await screen.findByLabelText(/^volume$/i), '20')
    const dialog = await screen.findByRole('dialog', { name: /add aquarium/i })
    await user.click(within(dialog).getByRole('button', { name: /^add aquarium$/i }))

    await waitFor(() => {
      expect(createAquariumMock).toHaveBeenCalledWith(
        {
          name: 'Office Nano',
          type: 'Saltwater Reef',
          volume: { value: 20, unit: 'L' },
        },
      )
    })

    expect(await screen.findByText('Office Nano')).toBeInTheDocument()
  })

  it('updates a record through API and refreshes the row', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Living Room Reef')
    await user.click(screen.getByRole('button', { name: /edit/i }))

    const nameInput = await screen.findByLabelText(/aquarium name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Living Room Reef Updated')
    const volumeInput = await screen.findByLabelText(/^volume$/i)
    await user.clear(volumeInput)
    await user.type(volumeInput, '300')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(updateAquariumMock).toHaveBeenCalledWith(
        'aq-1',
        {
          name: 'Living Room Reef Updated',
          type: 'Saltwater Reef',
          volume: { value: 300, unit: 'L' },
        },
      )
    })

    expect(await screen.findByText('Living Room Reef Updated')).toBeInTheDocument()
  })

  it('requires confirmation before delete and deletes only after confirmation', async () => {
    const user = userEvent.setup()

    renderPage()
    await screen.findByText('Living Room Reef')

    const aquariumRow = screen.getByText('Living Room Reef').closest('tr')
    expect(aquariumRow).not.toBeNull()
    const rowActions = within(aquariumRow as HTMLTableRowElement)

    await user.click(rowActions.getByRole('button', { name: /delete/i }))
    const deleteDialog = await screen.findByRole('dialog', { name: /delete aquarium/i })
    await user.click(within(deleteDialog).getByRole('button', { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /delete aquarium/i })).not.toBeInTheDocument()
    })
    expect(deleteAquariumMock).not.toHaveBeenCalled()

    await user.click(rowActions.getByRole('button', { name: /delete/i }))
    const confirmDialog = await screen.findByRole('dialog', { name: /delete aquarium/i })
    await user.click(within(confirmDialog).getByRole('button', { name: /^delete$/i }))
    await waitFor(() => {
      expect(deleteAquariumMock).toHaveBeenCalledWith('aq-1')
    })
  })

  it('shows recoverable error state and retries load', async () => {
    const user = userEvent.setup()
    listAquariumsMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce([
        {
          id: 'aq-1',
          name: 'Living Room Reef',
          type: 'Saltwater Reef',
          volumeLiters: 280,
          createdAt: '2026-07-18T10:00:00Z',
          updatedAt: '2026-07-18T10:00:00Z',
        },
      ])

    renderPage()
    await screen.findByText(/could not load aquariums/i)
    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(await screen.findByText('Living Room Reef')).toBeInTheDocument()
    expect(listAquariumsMock).toHaveBeenCalled()
  })
})
