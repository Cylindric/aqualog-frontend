import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { Provider } from '../../components/ui/provider'
import { MeasurementsPage } from '../../pages/MeasurementsPage'
import { listAquariums } from '../../api/aquariums'
import { createSalinityMeasurement, listSalinityMeasurements } from '../../api/measurements'

vi.mock('../../api/aquariums', () => ({
  listAquariums: vi.fn(),
}))

vi.mock('../../api/measurements', () => ({
  listSalinityMeasurements: vi.fn(),
  createSalinityMeasurement: vi.fn(),
}))

function Wrapper({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}

const listAquariumsMock = vi.mocked(listAquariums)
const listSalinityMeasurementsMock = vi.mocked(listSalinityMeasurements)
const createSalinityMeasurementMock = vi.mocked(createSalinityMeasurement)

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
      id: 'm-1',
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
      id: 'm-2',
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

  createSalinityMeasurementMock.mockResolvedValue({
    id: 'm-3',
    aquariumId: 'aq-1',
    parameter: 'salinity',
    value: 35.5,
    unit: 'ppt',
    rawValue: 35.5,
    rawUnit: 'ppt',
    measuredAt: '2026-07-20T10:00:00Z',
    createdAt: '2026-07-20T10:01:00Z',
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MeasurementsPage', () => {
  it('submits a salinity measurement and refreshes history', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: /salinity measurements/i })
    const valueInput = await screen.findByLabelText(/salinity \(ppt\)/i)

    await user.type(valueInput, '35.5')
    await user.click(screen.getByRole('button', { name: /add measurement/i }))

    await waitFor(() => {
      expect(createSalinityMeasurementMock).toHaveBeenCalled()
    })

    const createCall = createSalinityMeasurementMock.mock.calls[0]
    expect(createCall?.[0]).toBe('aq-1')
    expect(createCall?.[1].value).toBe(35.5)
    expect(listSalinityMeasurementsMock).toHaveBeenCalledTimes(2)
  })

  it('shows validation feedback for invalid input', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: /salinity measurements/i })
    await user.click(screen.getByRole('button', { name: /add measurement/i }))

    expect(await screen.findByText(/enter a salinity value greater than 0 ppt/i)).toBeInTheDocument()
    expect(createSalinityMeasurementMock).not.toHaveBeenCalled()
  })

  it('renders history newest first and keeps ppt display', async () => {
    renderPage()

    await screen.findByText(/salinity trend \(ppt\)/i)

    const rows = await screen.findAllByRole('row')
    const bodyRows = rows.filter((row) => within(row).queryByText(/ppt/i))
    expect(bodyRows[0]).toHaveTextContent('35.00 ppt')
    expect(bodyRows[1]).toHaveTextContent('34.00 ppt')
  })

  it('shows recoverable history error and retries', async () => {
    const user = userEvent.setup()
    listSalinityMeasurementsMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce([
        {
          id: 'm-2',
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

  it('shows chart fallback and keeps history visible with sparse data', async () => {
    listSalinityMeasurementsMock.mockResolvedValueOnce([
      {
        id: 'm-1',
        aquariumId: 'aq-1',
        parameter: 'salinity',
        value: 34,
        unit: 'ppt',
        rawValue: 34,
        rawUnit: 'ppt',
        measuredAt: '2026-07-18T10:00:00Z',
        createdAt: '2026-07-18T10:01:00Z',
      },
    ])

    renderPage()

    await screen.findByText(/trend visualization unavailable/i)
    expect(screen.getByText('34.00 ppt')).toBeInTheDocument()
  })
})
