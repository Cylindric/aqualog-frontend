import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { Provider } from '../../components/ui/provider'
import { MeasurementsPage } from '../../pages/MeasurementsPage'
import { listAquariums } from '../../api/aquariums'
import {
  createAmmoniaMeasurement,
  createCalciumMeasurement,
  createPhosphateMeasurement,
  createSalinityMeasurement,
  deleteMeasurement,
  listAlkalinityMeasurements,
  listAmmoniaMeasurements,
  listCalciumMeasurements,
  listMagnesiumMeasurements,
  listNitrateMeasurements,
  listNitriteMeasurements,
  listPhMeasurements,
  listPhosphateMeasurements,
  listSalinityMeasurements,
  type MeasurementParameter,
  type MeasurementRecord,
  type MeasurementUnit,
} from '../../api/measurements'
import { getThreshold, THRESHOLD_UNITS, type ThresholdParameter } from '../../api/thresholds'

vi.mock('../../api/aquariums', () => ({
  listAquariums: vi.fn(),
}))

vi.mock('../../api/measurements', () => ({
  listSalinityMeasurements: vi.fn(),
  listPhosphateMeasurements: vi.fn(),
  listCalciumMeasurements: vi.fn(),
  listMagnesiumMeasurements: vi.fn(),
  listAlkalinityMeasurements: vi.fn(),
  listPhMeasurements: vi.fn(),
  listAmmoniaMeasurements: vi.fn(),
  listNitriteMeasurements: vi.fn(),
  listNitrateMeasurements: vi.fn(),
  createSalinityMeasurement: vi.fn(),
  createPhosphateMeasurement: vi.fn(),
  createCalciumMeasurement: vi.fn(),
  createMagnesiumMeasurement: vi.fn(),
  createAlkalinityMeasurement: vi.fn(),
  createPhMeasurement: vi.fn(),
  createAmmoniaMeasurement: vi.fn(),
  createNitriteMeasurement: vi.fn(),
  createNitrateMeasurement: vi.fn(),
  deleteMeasurement: vi.fn(),
}))

vi.mock('../../api/thresholds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/thresholds')>()
  return {
    ...actual,
    getThreshold: vi.fn(),
  }
})

function Wrapper({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}

const listAquariumsMock = vi.mocked(listAquariums)
const listSalinityMeasurementsMock = vi.mocked(listSalinityMeasurements)
const listPhosphateMeasurementsMock = vi.mocked(listPhosphateMeasurements)
const listCalciumMeasurementsMock = vi.mocked(listCalciumMeasurements)
const listMagnesiumMeasurementsMock = vi.mocked(listMagnesiumMeasurements)
const listAlkalinityMeasurementsMock = vi.mocked(listAlkalinityMeasurements)
const listPhMeasurementsMock = vi.mocked(listPhMeasurements)
const listAmmoniaMeasurementsMock = vi.mocked(listAmmoniaMeasurements)
const listNitriteMeasurementsMock = vi.mocked(listNitriteMeasurements)
const listNitrateMeasurementsMock = vi.mocked(listNitrateMeasurements)
const createSalinityMeasurementMock = vi.mocked(createSalinityMeasurement)
const createPhosphateMeasurementMock = vi.mocked(createPhosphateMeasurement)
const createCalciumMeasurementMock = vi.mocked(createCalciumMeasurement)
const createAmmoniaMeasurementMock = vi.mocked(createAmmoniaMeasurement)
const deleteMeasurementMock = vi.mocked(deleteMeasurement)
const getThresholdMock = vi.mocked(getThreshold)

const UNIT_BY_PARAMETER: Record<MeasurementParameter, MeasurementUnit> = {
  salinity: 'ppt',
  phosphate: 'ppm',
  calcium: 'ppm',
  magnesium: 'ppm',
  alkalinity: 'dKH',
  ph: 'pH',
  ammonia: 'mg/L',
  nitrite: 'ppm',
  nitrate: 'ppm',
}

function measurementFixture(
  id: string,
  parameter: MeasurementParameter,
  value: number,
  measuredAt: string,
): MeasurementRecord {
  const unit = UNIT_BY_PARAMETER[parameter]
  return {
    id,
    aquariumId: 'aq-1',
    parameter,
    value,
    unit,
    rawValue: value,
    rawUnit: unit,
    measuredAt,
    createdAt: measuredAt,
  }
}

function emptyThreshold(parameter: ThresholdParameter) {
  return {
    aquariumId: 'aq-1',
    parameter,
    target: null,
    min: null,
    max: null,
    unit: THRESHOLD_UNITS[parameter],
  }
}

function renderPage() {
  return render(<MeasurementsPage />, { wrapper: Wrapper })
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

  listSalinityMeasurementsMock.mockResolvedValue([
    measurementFixture('s-1', 'salinity', 34, '2026-07-18T10:00:00Z'),
    measurementFixture('s-2', 'salinity', 35, '2026-07-19T10:00:00Z'),
  ])
  listPhosphateMeasurementsMock.mockResolvedValue([
    measurementFixture('p-1', 'phosphate', 0.07, '2026-07-18T10:00:00Z'),
    measurementFixture('p-2', 'phosphate', 0.12, '2026-07-19T10:00:00Z'),
  ])
  listCalciumMeasurementsMock.mockResolvedValue([])
  listMagnesiumMeasurementsMock.mockResolvedValue([])
  listAlkalinityMeasurementsMock.mockResolvedValue([])
  listPhMeasurementsMock.mockResolvedValue([])
  listAmmoniaMeasurementsMock.mockResolvedValue([])
  listNitriteMeasurementsMock.mockResolvedValue([])
  listNitrateMeasurementsMock.mockResolvedValue([])

  createSalinityMeasurementMock.mockResolvedValue(
    measurementFixture('s-3', 'salinity', 35.5, '2026-07-20T10:00:00Z'),
  )
  createPhosphateMeasurementMock.mockResolvedValue(
    measurementFixture('p-3', 'phosphate', 0.08, '2026-07-20T10:00:00Z'),
  )
  createCalciumMeasurementMock.mockResolvedValue(
    measurementFixture('c-1', 'calcium', 420, '2026-07-20T10:00:00Z'),
  )
  createAmmoniaMeasurementMock.mockResolvedValue(
    measurementFixture('a-1', 'ammonia', 0.25, '2026-07-20T10:00:00Z'),
  )

  deleteMeasurementMock.mockResolvedValue()

  getThresholdMock.mockImplementation(async (_aquariumId, parameter) => emptyThreshold(parameter))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MeasurementsPage', () => {
  it('renders a value input for every supported parameter', async () => {
    renderPage()

    await screen.findByRole('heading', { name: /aquarium measurements/i })

    for (const [label, unit] of [
      ['salinity', 'ppt'],
      ['phosphate', 'ppm'],
      ['calcium', 'ppm'],
      ['magnesium', 'ppm'],
      ['alkalinity', 'dKH'],
      ['ammonia', 'mg/L'],
      ['nitrite', 'ppm'],
      ['nitrate', 'ppm'],
    ] as const) {
      expect(screen.getByLabelText(new RegExp(`${label} \\(${unit}\\)`, 'i'))).toBeInTheDocument()
    }
    expect(screen.getByLabelText(/^ph \(ph\)/i)).toBeInTheDocument()
  })

  it('submits salinity and phosphate with shared measured-at context and refreshes history', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: /aquarium measurements/i })

    await user.type(await screen.findByLabelText(/salinity \(ppt\)/i), '35.5')
    await user.type(screen.getByLabelText(/phosphate \(ppm\)/i), '0.075')
    await user.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(createSalinityMeasurementMock).toHaveBeenCalledTimes(1)
      expect(createPhosphateMeasurementMock).toHaveBeenCalledTimes(1)
    })

    const salinityCall = createSalinityMeasurementMock.mock.calls[0]
    const phosphateCall = createPhosphateMeasurementMock.mock.calls[0]

    expect(salinityCall?.[0]).toBe('aq-1')
    expect(phosphateCall?.[0]).toBe('aq-1')
    expect(salinityCall?.[1].measuredAt).toBe(phosphateCall?.[1].measuredAt)
    expect(listSalinityMeasurementsMock).toHaveBeenCalledTimes(2)
    expect(listPhosphateMeasurementsMock).toHaveBeenCalledTimes(2)
  })

  it('submits a new parameter reading (calcium) alongside an existing one (ammonia)', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: /aquarium measurements/i })

    await user.type(await screen.findByLabelText(/calcium \(ppm\)/i), '420')
    await user.type(screen.getByLabelText(/ammonia \(mg\/L\)/i), '0.25')
    await user.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(createCalciumMeasurementMock).toHaveBeenCalledWith(
        'aq-1',
        expect.objectContaining({ value: 420 }),
      )
      expect(createAmmoniaMeasurementMock).toHaveBeenCalledWith(
        'aq-1',
        expect.objectContaining({ value: 0.25 }),
      )
    })
  })

  it('shows validation feedback on every parameter field when no values are provided', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: /aquarium measurements/i })
    await user.click(screen.getByRole('button', { name: /^add$/i }))

    expect(await screen.findAllByText(/enter at least one measurement value to submit/i)).toHaveLength(9)
    expect(createSalinityMeasurementMock).not.toHaveBeenCalled()
    expect(createPhosphateMeasurementMock).not.toHaveBeenCalled()
    expect(createCalciumMeasurementMock).not.toHaveBeenCalled()
  })

  it('renders salinity and phosphate trend cards and parameter-specific history tables', async () => {
    renderPage()

    await screen.findByText(/salinity trend \(ppt\)/i)
    expect(screen.getByText(/phosphate trend \(ppm\)/i)).toBeInTheDocument()

    const salinityCard = screen.getByTestId('salinity-history-table')
    const phosphateCard = screen.getByTestId('phosphate-history-table')

    expect(salinityCard).toHaveTextContent('35.00 ppt')
    expect(salinityCard).toHaveTextContent('34.00 ppt')
    expect(phosphateCard).toHaveTextContent('0.120 ppm')
    expect(phosphateCard).toHaveTextContent('0.070 ppm')
  })

  it('hides the history card for a parameter with no readings yet by default, and shows it when "show empty" is checked', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId('salinity-history-table')

    expect(screen.queryByText(/calcium history unavailable/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /show empty tables and charts/i }))

    expect(await screen.findByText(/calcium history unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/no calcium entries are available yet/i)).toBeInTheDocument()
  })

  it('deletes a measurement row after confirming, and refreshes both histories', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId('salinity-history-table')

    const salinityCard = screen.getByTestId('salinity-history-table')
    const deleteButton = within(salinityCard).getAllByRole('button', { name: /delete/i })[0]
    await user.click(deleteButton)

    expect(await screen.findByRole('heading', { name: /delete measurement\?/i })).toBeInTheDocument()
    expect(deleteMeasurementMock).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(deleteMeasurementMock).toHaveBeenCalledWith('aq-1', 'salinity', 's-2')
    })

    expect(listSalinityMeasurementsMock).toHaveBeenCalledTimes(2)
    expect(listPhosphateMeasurementsMock).toHaveBeenCalledTimes(2)
  })

  it('cancels a pending delete without calling the API', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId('salinity-history-table')

    const salinityCard = screen.getByTestId('salinity-history-table')
    const deleteButton = within(salinityCard).getAllByRole('button', { name: /delete/i })[0]
    await user.click(deleteButton)

    await screen.findByRole('heading', { name: /delete measurement\?/i })
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /delete measurement\?/i })).not.toBeInTheDocument()
    })
    expect(deleteMeasurementMock).not.toHaveBeenCalled()
  })

  it('deletes a measurement immediately without confirmation when shift-clicked', async () => {
    renderPage()

    await screen.findByTestId('salinity-history-table')

    const salinityCard = screen.getByTestId('salinity-history-table')
    const deleteButton = within(salinityCard).getAllByRole('button', { name: /delete/i })[0]
    fireEvent.click(deleteButton, { shiftKey: true })

    await waitFor(() => {
      expect(deleteMeasurementMock).toHaveBeenCalledWith('aq-1', 'salinity', 's-2')
    })
    expect(screen.queryByRole('heading', { name: /delete measurement\?/i })).not.toBeInTheDocument()
  })

  it('shows recoverable history error and retries', async () => {
    const user = userEvent.setup()
    listSalinityMeasurementsMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce([measurementFixture('s-2', 'salinity', 35, '2026-07-19T10:00:00Z')])

    renderPage()

    await screen.findByText(/could not load measurement history/i)
    await user.click(screen.getByRole('button', { name: /^retry$/i }))

    expect(await screen.findByText('35.00 ppt')).toBeInTheDocument()
  })

  it('shows delete failure message with retry action', async () => {
    const user = userEvent.setup()
    deleteMeasurementMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    renderPage()

    await screen.findByTestId('phosphate-history-table')

    const phosphateCard = screen.getByTestId('phosphate-history-table')
    const deleteButton = within(phosphateCard).getAllByRole('button', { name: /delete/i })[0]
    await user.click(deleteButton)

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    expect(await screen.findByText(/could not delete measurement/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry delete/i })).toBeInTheDocument()
  })

  it('fetches configured thresholds for the selected aquarium instead of using hardcoded values', async () => {
    getThresholdMock.mockImplementation(async (aquariumId, parameter) => {
      if (parameter === 'salinity') {
        return { aquariumId, parameter, min: 33, target: 35, max: 37, unit: 'ppt' }
      }
      return emptyThreshold(parameter)
    })

    renderPage()

    await screen.findByText(/salinity trend \(ppt\)/i)

    await waitFor(() => {
      expect(getThresholdMock).toHaveBeenCalledWith('aq-1', 'salinity', expect.anything())
      expect(getThresholdMock).toHaveBeenCalledWith('aq-1', 'phosphate', expect.anything())
      expect(getThresholdMock).toHaveBeenCalledWith('aq-1', 'calcium', expect.anything())
      expect(getThresholdMock).toHaveBeenCalledWith('aq-1', 'ammonia', expect.anything())
    })
  })

  it('does not fetch thresholds until an aquarium is selected, and degrades gracefully if the fetch fails', async () => {
    getThresholdMock.mockRejectedValue(new TypeError('Failed to fetch'))
    listAquariumsMock.mockResolvedValueOnce([])

    renderPage()

    await screen.findByRole('heading', { name: /aquarium measurements/i })
    expect(getThresholdMock).not.toHaveBeenCalled()
  })

  it('hides phosphate chart fallback by default when phosphate data is sparse, and shows it when "show empty" is checked', async () => {
    const user = userEvent.setup()
    listPhosphateMeasurementsMock.mockResolvedValueOnce([
      measurementFixture('p-1', 'phosphate', 0.08, '2026-07-18T10:00:00Z'),
    ])

    renderPage()

    await screen.findByTestId('phosphate-history-table')
    expect(screen.queryByText(/phosphate trend unavailable/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /show empty tables and charts/i }))

    expect(await screen.findByText(/phosphate trend unavailable/i)).toBeInTheDocument()
    expect(screen.getByText('0.080 ppm')).toBeInTheDocument()
  })
})
