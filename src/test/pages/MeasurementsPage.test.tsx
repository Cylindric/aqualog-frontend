import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { Provider } from '../../components/ui/provider'
import { MeasurementsPage } from '../../pages/MeasurementsPage'
import { listAquariums } from '../../api/aquariums'
import {
  createPhosphateMeasurement,
  createSalinityMeasurement,
  deleteMeasurement,
  listPhosphateMeasurements,
  listSalinityMeasurements,
} from '../../api/measurements'

vi.mock('../../api/aquariums', () => ({
  listAquariums: vi.fn(),
}))

vi.mock('../../api/measurements', () => ({
  listSalinityMeasurements: vi.fn(),
  listPhosphateMeasurements: vi.fn(),
  createSalinityMeasurement: vi.fn(),
  createPhosphateMeasurement: vi.fn(),
  deleteMeasurement: vi.fn(),
}))

function Wrapper({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}

const listAquariumsMock = vi.mocked(listAquariums)
const listSalinityMeasurementsMock = vi.mocked(listSalinityMeasurements)
const listPhosphateMeasurementsMock = vi.mocked(listPhosphateMeasurements)
const createSalinityMeasurementMock = vi.mocked(createSalinityMeasurement)
const createPhosphateMeasurementMock = vi.mocked(createPhosphateMeasurement)
const deleteMeasurementMock = vi.mocked(deleteMeasurement)

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
    {
      id: 's-1',
      aquariumId: 'aq-1',
      parameter: 'salinity',
      value: 34,
      unit: 'ppt',
      rawValue: 34,
      rawUnit: 'ppt',
      measuredAt: '2026-07-18T10:00:00Z',
      createdAt: '2026-07-18T10:01:00Z',
    },
    {
      id: 's-2',
      aquariumId: 'aq-1',
      parameter: 'salinity',
      value: 35,
      unit: 'ppt',
      rawValue: 35,
      rawUnit: 'ppt',
      measuredAt: '2026-07-19T10:00:00Z',
      createdAt: '2026-07-19T10:01:00Z',
    },
  ])

  listPhosphateMeasurementsMock.mockResolvedValue([
    {
      id: 'p-1',
      aquariumId: 'aq-1',
      parameter: 'phosphate',
      value: 0.07,
      unit: 'ppm',
      rawValue: 0.07,
      rawUnit: 'ppm',
      measuredAt: '2026-07-18T10:00:00Z',
      createdAt: '2026-07-18T10:01:00Z',
    },
    {
      id: 'p-2',
      aquariumId: 'aq-1',
      parameter: 'phosphate',
      value: 0.12,
      unit: 'ppm',
      rawValue: 0.12,
      rawUnit: 'ppm',
      measuredAt: '2026-07-19T10:00:00Z',
      createdAt: '2026-07-19T10:01:00Z',
    },
  ])

  createSalinityMeasurementMock.mockResolvedValue({
    id: 's-3',
    aquariumId: 'aq-1',
    parameter: 'salinity',
    value: 35.5,
    unit: 'ppt',
    rawValue: 35.5,
    rawUnit: 'ppt',
    measuredAt: '2026-07-20T10:00:00Z',
    createdAt: '2026-07-20T10:01:00Z',
  })

  createPhosphateMeasurementMock.mockResolvedValue({
    id: 'p-3',
    aquariumId: 'aq-1',
    parameter: 'phosphate',
    value: 0.08,
    unit: 'ppm',
    rawValue: 0.08,
    rawUnit: 'ppm',
    measuredAt: '2026-07-20T10:00:00Z',
    createdAt: '2026-07-20T10:01:00Z',
  })

  deleteMeasurementMock.mockResolvedValue()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MeasurementsPage', () => {
  it('submits both salinity and phosphate with shared measured-at context and refreshes history', async () => {
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

  it('shows validation feedback when no parameter values are provided', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: /aquarium measurements/i })
    await user.click(screen.getByRole('button', { name: /^add$/i }))

    expect(await screen.findAllByText(/enter at least one measurement value to submit/i)).toHaveLength(2)
    expect(createSalinityMeasurementMock).not.toHaveBeenCalled()
    expect(createPhosphateMeasurementMock).not.toHaveBeenCalled()
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

  it('deletes a measurement row and refreshes both histories', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId('salinity-history-table')

    const salinityCard = screen.getByTestId('salinity-history-table')
    const deleteButton = within(salinityCard).getAllByRole('button', { name: /delete/i })[0]
    await user.click(deleteButton)

    await waitFor(() => {
      expect(deleteMeasurementMock).toHaveBeenCalledWith('aq-1', 'salinity', 's-2')
    })

    expect(listSalinityMeasurementsMock).toHaveBeenCalledTimes(2)
    expect(listPhosphateMeasurementsMock).toHaveBeenCalledTimes(2)
  })

  it('shows recoverable history error and retries', async () => {
    const user = userEvent.setup()
    listSalinityMeasurementsMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce([
        {
          id: 's-2',
          aquariumId: 'aq-1',
          parameter: 'salinity',
          value: 35,
          unit: 'ppt',
          rawValue: 35,
          rawUnit: 'ppt',
          measuredAt: '2026-07-19T10:00:00Z',
          createdAt: '2026-07-19T10:01:00Z',
        },
      ])

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

    expect(await screen.findByText(/could not delete measurement/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry delete/i })).toBeInTheDocument()
  })

  it('shows phosphate chart fallback when phosphate data is sparse', async () => {
    listPhosphateMeasurementsMock.mockResolvedValueOnce([
      {
        id: 'p-1',
        aquariumId: 'aq-1',
        parameter: 'phosphate',
        value: 0.08,
        unit: 'ppm',
        rawValue: 0.08,
        rawUnit: 'ppm',
        measuredAt: '2026-07-18T10:00:00Z',
        createdAt: '2026-07-18T10:01:00Z',
      },
    ])

    renderPage()

    await screen.findByText(/phosphate trend unavailable/i)
    expect(screen.getByText('0.080 ppm')).toBeInTheDocument()
  })
})
