import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { Provider } from '../../components/ui/provider'
import { AquariumDetailPage } from '../../pages/AquariumDetailPage'
import { type AquariumRecord, getAquarium, updateAquarium } from '../../api/aquariums'
import { listParameters, type ParameterRecord } from '../../api/parameters'
import {
  THRESHOLD_UNITS,
  getThreshold,
  setThreshold,
  type ThresholdParameter,
  type ThresholdRecord,
} from '../../api/thresholds'
import { ApiRequestError } from '../../api/client'

vi.mock('../../api/aquariums', () => ({
  getAquarium: vi.fn(),
  updateAquarium: vi.fn(),
}))

vi.mock('../../api/parameters', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/parameters')>()
  return {
    ...actual,
    listParameters: vi.fn(),
  }
})

vi.mock('../../api/thresholds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/thresholds')>()
  return {
    ...actual,
    getThreshold: vi.fn(),
    setThreshold: vi.fn(),
  }
})

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

const getAquariumMock = vi.mocked(getAquarium)
const updateAquariumMock = vi.mocked(updateAquarium)
const listParametersMock = vi.mocked(listParameters)
const getThresholdMock = vi.mocked(getThreshold)
const setThresholdMock = vi.mocked(setThreshold)

const baseAquarium: AquariumRecord = {
  id: 'aq-1',
  name: 'Living Room Reef',
  type: 'Saltwater Reef',
  volumeLiters: 280,
  createdAt: '2026-07-18T10:00:00Z',
  updatedAt: '2026-07-18T10:00:00Z',
}

function parameterFixture(slug: ThresholdParameter, displayName: string): ParameterRecord {
  return {
    slug,
    displayName,
    description: null,
    unit: THRESHOLD_UNITS[slug],
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-18T10:00:00Z',
  }
}

const PARAMETER_CATALOG: ParameterRecord[] = [
  parameterFixture('temperature', 'Temperature'),
  parameterFixture('salinity', 'Salinity'),
  parameterFixture('phosphate', 'Phosphate'),
  parameterFixture('calcium', 'Calcium'),
  parameterFixture('magnesium', 'Magnesium'),
  parameterFixture('alkalinity', 'Alkalinity'),
  parameterFixture('ph', 'pH'),
  parameterFixture('ammonia', 'Ammonia'),
  parameterFixture('nitrite', 'Nitrite'),
  parameterFixture('nitrate', 'Nitrate'),
]

function emptyThreshold(parameter: ThresholdParameter): ThresholdRecord {
  return {
    aquariumId: 'aq-1',
    parameter,
    target: null,
    min: null,
    max: null,
    unit: THRESHOLD_UNITS[parameter],
  }
}

function renderPage(id = 'aq-1') {
  return render(
    <MemoryRouter initialEntries={[`/aquariums/${id}`]}>
      <Routes>
        <Route path="/aquariums/:id" element={<AquariumDetailPage />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  )
}

function parameterCard(label: string): HTMLElement {
  const cell = screen.getByText(label)
  const row = cell.closest('tr')
  if (!row) throw new Error(`Could not find row for ${label}`)
  return row as HTMLElement
}

beforeEach(() => {
  vi.clearAllMocks()
  getAquariumMock.mockResolvedValue(baseAquarium)
  updateAquariumMock.mockResolvedValue(baseAquarium)
  listParametersMock.mockResolvedValue(PARAMETER_CATALOG)
  getThresholdMock.mockImplementation(async (_aquariumId, parameter) => emptyThreshold(parameter))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AquariumDetailPage', () => {
  it('loads the aquarium and pre-fills existing thresholds, leaving unset parameters empty', async () => {
    getThresholdMock.mockImplementation(async (_aquariumId, parameter) => {
      if (parameter === 'temperature') {
        return { aquariumId: 'aq-1', parameter, min: 24, target: 25, max: 26, unit: 'celsius' }
      }
      return emptyThreshold(parameter)
    })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Living Room Reef' })).toBeInTheDocument()

    const temperatureCard = parameterCard('Temperature (celsius)')
    await waitFor(() => {
      expect((within(temperatureCard).getByLabelText('Min') as HTMLInputElement).value).toBe('24')
    })
    expect((within(temperatureCard).getByLabelText('Target') as HTMLInputElement).value).toBe('25')
    expect((within(temperatureCard).getByLabelText('Max') as HTMLInputElement).value).toBe('26')

    const salinityCard = parameterCard('Salinity (ppt)')
    expect((within(salinityCard).getByLabelText('Min') as HTMLInputElement).value).toBe('')
    expect((within(salinityCard).getByLabelText('Target') as HTMLInputElement).value).toBe('')
    expect((within(salinityCard).getByLabelText('Max') as HTMLInputElement).value).toBe('')
  })

  it('renders threshold cards for the newly supported water parameters', async () => {
    renderPage()

    await screen.findByRole('heading', { name: 'Living Room Reef' })

    for (const label of [
      'Calcium (ppm)',
      'Magnesium (ppm)',
      'Alkalinity (dKH)',
      'pH (pH)',
      'Ammonia (mg/L)',
      'Nitrite (ppm)',
      'Nitrate (ppm)',
    ]) {
      expect(parameterCard(label)).toBeInTheDocument()
    }
  })

  it('saves a calcium threshold row', async () => {
    const user = userEvent.setup()
    setThresholdMock.mockResolvedValue({
      aquariumId: 'aq-1',
      parameter: 'calcium',
      min: 400,
      target: 420,
      max: 450,
      unit: 'ppm',
    })

    renderPage()
    await screen.findByRole('heading', { name: 'Living Room Reef' })

    const calciumCard = parameterCard('Calcium (ppm)')
    await user.type(within(calciumCard).getByLabelText('Target'), '420')
    await user.click(within(calciumCard).getByRole('button', { name: /save calcium limits/i }))

    await waitFor(() => {
      expect(setThresholdMock).toHaveBeenCalledWith('aq-1', 'calcium', {
        min: null,
        target: 420,
        max: null,
      })
    })
  })

  it('saves a parameter row and reflects the returned values', async () => {
    const user = userEvent.setup()
    setThresholdMock.mockResolvedValue({
      aquariumId: 'aq-1',
      parameter: 'salinity',
      min: 1.023,
      target: 1.025,
      max: 1.027,
      unit: 'ppt',
    })

    renderPage()
    await screen.findByRole('heading', { name: 'Living Room Reef' })

    const salinityCard = parameterCard('Salinity (ppt)')
    await user.type(within(salinityCard).getByLabelText('Min'), '1.023')
    await user.type(within(salinityCard).getByLabelText('Target'), '1.025')
    await user.type(within(salinityCard).getByLabelText('Max'), '1.027')
    await user.click(within(salinityCard).getByRole('button', { name: /save salinity limits/i }))

    await waitFor(() => {
      expect(setThresholdMock).toHaveBeenCalledWith('aq-1', 'salinity', {
        min: 1.023,
        target: 1.025,
        max: 1.027,
      })
    })
  })

  it('blocks saving when values violate the min <= target <= max ordering', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Living Room Reef' })

    const temperatureCard = parameterCard('Temperature (celsius)')
    await user.type(within(temperatureCard).getByLabelText('Target'), '30')
    await user.type(within(temperatureCard).getByLabelText('Max'), '26')
    await user.click(within(temperatureCard).getByRole('button', { name: /save temperature limits/i }))

    expect(
      await within(temperatureCard).findByText(/target must be less than or equal to max/i),
    ).toBeInTheDocument()
    expect(setThresholdMock).not.toHaveBeenCalled()
  })

  it('blocks saving when a value is outside the parameter sanity range', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Living Room Reef' })

    const temperatureCard = parameterCard('Temperature (celsius)')
    await user.type(within(temperatureCard).getByLabelText('Target'), '60')
    await user.click(within(temperatureCard).getByRole('button', { name: /save temperature limits/i }))

    expect(await within(temperatureCard).findByText(/must be between 0 and 45/i)).toBeInTheDocument()
    expect(setThresholdMock).not.toHaveBeenCalled()
  })

  it('keeps rows independent when one parameter fails to save', async () => {
    const user = userEvent.setup()
    setThresholdMock.mockImplementation(async (_aquariumId, parameter, input) => {
      if (parameter === 'phosphate') {
        throw new ApiRequestError('Validation failed', 422, [
          { loc: ['body', 'max'], msg: 'max must be between 0 and 100', type: 'value_error' },
        ])
      }
      return { aquariumId: 'aq-1', parameter, unit: THRESHOLD_UNITS[parameter], ...input }
    })

    renderPage()
    await screen.findByRole('heading', { name: 'Living Room Reef' })

    const salinityCard = parameterCard('Salinity (ppt)')
    await user.type(within(salinityCard).getByLabelText('Target'), '1.025')
    await user.click(within(salinityCard).getByRole('button', { name: /save salinity limits/i }))

    const phosphateCard = parameterCard('Phosphate (ppm)')
    await user.type(within(phosphateCard).getByLabelText('Target'), '0.05')
    await user.click(within(phosphateCard).getByRole('button', { name: /save phosphate limits/i }))

    await waitFor(() => {
      expect(setThresholdMock).toHaveBeenCalledWith('aq-1', 'salinity', expect.anything())
    })
    expect(
      await within(phosphateCard).findAllByText(/max must be between 0 and 100/i),
    ).not.toHaveLength(0)
    expect(within(salinityCard).queryByText(/must be between/i)).not.toBeInTheDocument()
  })

  it('saves aquarium name/type/volume changes', async () => {
    const user = userEvent.setup()
    updateAquariumMock.mockResolvedValue({
      ...baseAquarium,
      name: 'Living Room Reef Updated',
      volumeLiters: 300,
    })

    renderPage()
    await screen.findByRole('heading', { name: 'Living Room Reef' })

    const nameInput = screen.getByLabelText(/aquarium name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Living Room Reef Updated')
    const volumeInput = screen.getByLabelText(/^volume$/i)
    await user.clear(volumeInput)
    await user.type(volumeInput, '300')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(updateAquariumMock).toHaveBeenCalledWith('aq-1', {
        name: 'Living Room Reef Updated',
        type: 'Saltwater Reef',
        volume: { value: 300, unit: 'L' },
      })
    })
    expect(await screen.findByRole('heading', { name: 'Living Room Reef Updated' })).toBeInTheDocument()
  })

  it('shows a not-found state when the aquarium does not exist', async () => {
    getAquariumMock.mockRejectedValue(new ApiRequestError('Aquarium not found', 404))

    renderPage('missing-id')

    expect(await screen.findByText(/aquarium not found/i)).toBeInTheDocument()
  })

  it('shows a recoverable error state and retries load', async () => {
    const user = userEvent.setup()
    getAquariumMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(baseAquarium)

    renderPage()

    await screen.findByText(/could not load aquarium/i)
    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(await screen.findByRole('heading', { name: 'Living Room Reef' })).toBeInTheDocument()
  })

  it('renders and saves a parameter that is not in the fixed threshold set', async () => {
    const user = userEvent.setup()
    listParametersMock.mockResolvedValue([
      ...PARAMETER_CATALOG,
      {
        slug: 'copper' as ThresholdParameter,
        displayName: 'Copper',
        description: null,
        unit: 'ppm',
        createdAt: '2026-07-18T10:00:00Z',
        updatedAt: '2026-07-18T10:00:00Z',
      },
    ])
    setThresholdMock.mockResolvedValue({
      aquariumId: 'aq-1',
      parameter: 'copper' as ThresholdParameter,
      min: null,
      target: 0.2,
      max: null,
      unit: 'ppm',
    })

    renderPage()
    await screen.findByRole('heading', { name: 'Living Room Reef' })

    const copperCard = parameterCard('Copper (ppm)')
    await user.type(within(copperCard).getByLabelText('Target'), '0.2')
    await user.click(within(copperCard).getByRole('button', { name: /save copper limits/i }))

    await waitFor(() => {
      expect(setThresholdMock).toHaveBeenCalledWith('aq-1', 'copper', {
        min: null,
        target: 0.2,
        max: null,
      })
    })
  })

  it('omits cards for parameters no longer in the catalog', async () => {
    listParametersMock.mockResolvedValue(PARAMETER_CATALOG.filter((parameter) => parameter.slug !== 'nitrate'))

    renderPage()
    await screen.findByRole('heading', { name: 'Living Room Reef' })

    expect(screen.queryByText('Nitrate (ppm)')).not.toBeInTheDocument()
  })

  it('keeps the aquarium form usable when parameters fail to load', async () => {
    listParametersMock.mockRejectedValue(new TypeError('Failed to fetch'))

    renderPage()
    await screen.findByRole('heading', { name: 'Living Room Reef' })

    expect(await screen.findByText(/could not load parameters/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/aquarium name/i)).toBeInTheDocument()
  })
})
