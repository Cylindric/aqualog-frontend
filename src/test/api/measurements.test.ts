import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAlkalinityMeasurement,
  createAmmoniaMeasurement,
  createCalciumMeasurement,
  createPhMeasurement,
  createPhosphateMeasurement,
  createSalinityMeasurement,
  deleteMeasurement,
  listCalciumMeasurements,
  listPhosphateMeasurements,
  listSalinityMeasurements,
} from '../../api/measurements'
import { setAccessTokenProvider, setRefreshAccessTokenProvider } from '../../api/client'

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

beforeEach(() => {
  setAccessTokenProvider(() => 'test-token')
  setRefreshAccessTokenProvider(() => 'test-token')
})

afterEach(() => {
  vi.restoreAllMocks()
  setAccessTokenProvider(() => null)
  setRefreshAccessTokenProvider(() => null)
})

describe('measurements api', () => {
  it('lists salinity measurements and maps payload fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-1',
        data: [
          {
            id: 'm-1',
            aquarium_id: 'aq-1',
            parameter: 'salinity',
            value: 35.1,
            unit: 'ppt',
            raw_value: 35.1,
            raw_unit: 'ppt',
            measured_at: '2026-07-19T10:00:00Z',
            created_at: '2026-07-19T10:01:00Z',
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(listSalinityMeasurements('aq-1')).resolves.toEqual([
      {
        id: 'm-1',
        aquariumId: 'aq-1',
        parameter: 'salinity',
        value: 35.1,
        unit: 'ppt',
        rawValue: 35.1,
        rawUnit: 'ppt',
        measuredAt: '2026-07-19T10:00:00Z',
        createdAt: '2026-07-19T10:01:00Z',
      },
    ])

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums/aq-1/measurements/salinity')
    expect(options.method).toBe('GET')
  })

  it('lists phosphate measurements and maps ppm unit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-ph-1',
        data: [
          {
            id: 'm-ph-1',
            aquarium_id: 'aq-1',
            parameter: 'phosphate',
            value: 0.08,
            unit: 'ppm',
            raw_value: 0.08,
            raw_unit: 'ppm',
            measured_at: '2026-07-19T10:00:00Z',
            created_at: '2026-07-19T10:01:00Z',
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(listPhosphateMeasurements('aq-1')).resolves.toEqual([
      {
        id: 'm-ph-1',
        aquariumId: 'aq-1',
        parameter: 'phosphate',
        value: 0.08,
        unit: 'ppm',
        rawValue: 0.08,
        rawUnit: 'ppm',
        measuredAt: '2026-07-19T10:00:00Z',
        createdAt: '2026-07-19T10:01:00Z',
      },
    ])

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums/aq-1/measurements/phosphate')
  })

  it('creates salinity measurement with ppt unit payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        request_id: 'req-2',
        data: {
          id: 'm-2',
          aquarium_id: 'aq-1',
          parameter: 'salinity',
          value: 35,
          unit: 'ppt',
          raw_value: 35,
          raw_unit: 'ppt',
          measured_at: '2026-07-19T09:30:00Z',
          created_at: '2026-07-19T09:31:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createSalinityMeasurement('aq-1', {
        value: 35,
        measuredAt: '2026-07-19T09:30:00Z',
      }),
    ).resolves.toMatchObject({ id: 'm-2', unit: 'ppt' })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(options.method).toBe('POST')
    expect(options.body).toBe(
      JSON.stringify({
        unit: 'ppt',
        value: 35,
        measured_at: '2026-07-19T09:30:00Z',
      }),
    )
  })

  it('creates phosphate measurement with ppm unit payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        request_id: 'req-ph-2',
        data: {
          id: 'm-ph-2',
          aquarium_id: 'aq-1',
          parameter: 'phosphate',
          value: 0.075,
          unit: 'ppm',
          raw_value: 0.075,
          raw_unit: 'ppm',
          measured_at: '2026-07-19T09:30:00Z',
          created_at: '2026-07-19T09:31:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createPhosphateMeasurement('aq-1', {
        value: 0.075,
        measuredAt: '2026-07-19T09:30:00Z',
      }),
    ).resolves.toMatchObject({ id: 'm-ph-2', unit: 'ppm' })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(options.method).toBe('POST')
    expect(options.body).toBe(
      JSON.stringify({
        unit: 'ppm',
        value: 0.075,
        measured_at: '2026-07-19T09:30:00Z',
      }),
    )
  })

  it('lists calcium measurements and maps ppm unit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-ca-1',
        data: [
          {
            id: 'm-ca-1',
            aquarium_id: 'aq-1',
            parameter: 'calcium',
            value: 420,
            unit: 'ppm',
            raw_value: 420,
            raw_unit: 'ppm',
            measured_at: '2026-07-19T10:00:00Z',
            created_at: '2026-07-19T10:01:00Z',
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(listCalciumMeasurements('aq-1')).resolves.toEqual([
      {
        id: 'm-ca-1',
        aquariumId: 'aq-1',
        parameter: 'calcium',
        value: 420,
        unit: 'ppm',
        rawValue: 420,
        rawUnit: 'ppm',
        measuredAt: '2026-07-19T10:00:00Z',
        createdAt: '2026-07-19T10:01:00Z',
      },
    ])

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums/aq-1/measurements/calcium')
  })

  it('creates a calcium measurement with a ppm unit payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        request_id: 'req-ca-2',
        data: {
          id: 'm-ca-2',
          aquarium_id: 'aq-1',
          parameter: 'calcium',
          value: 420,
          unit: 'ppm',
          raw_value: 420,
          raw_unit: 'ppm',
          measured_at: '2026-07-19T09:30:00Z',
          created_at: '2026-07-19T09:31:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createCalciumMeasurement('aq-1', { value: 420, measuredAt: '2026-07-19T09:30:00Z' }),
    ).resolves.toMatchObject({ id: 'm-ca-2', unit: 'ppm' })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(options.body).toBe(
      JSON.stringify({ unit: 'ppm', value: 420, measured_at: '2026-07-19T09:30:00Z' }),
    )
  })

  it('creates an ammonia measurement with a lowercase "mg/l" request unit and preserves the "mg/L" response unit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        request_id: 'req-am-1',
        data: {
          id: 'm-am-1',
          aquarium_id: 'aq-1',
          parameter: 'ammonia',
          value: 0.25,
          unit: 'mg/L',
          raw_value: 0.25,
          raw_unit: 'mg/l',
          measured_at: '2026-07-19T09:30:00Z',
          created_at: '2026-07-19T09:31:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createAmmoniaMeasurement('aq-1', { value: 0.25, measuredAt: '2026-07-19T09:30:00Z' }),
    ).resolves.toMatchObject({ id: 'm-am-1', unit: 'mg/L' })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(options.body).toBe(
      JSON.stringify({ unit: 'mg/l', value: 0.25, measured_at: '2026-07-19T09:30:00Z' }),
    )
  })

  it('creates a pH measurement with a lowercase "ph" request unit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        request_id: 'req-ph-3',
        data: {
          id: 'm-ph-3',
          aquarium_id: 'aq-1',
          parameter: 'ph',
          value: 8.2,
          unit: 'pH',
          raw_value: 8.2,
          raw_unit: 'ph',
          measured_at: '2026-07-19T09:30:00Z',
          created_at: '2026-07-19T09:31:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createPhMeasurement('aq-1', { value: 8.2, measuredAt: '2026-07-19T09:30:00Z' }),
    ).resolves.toMatchObject({ id: 'm-ph-3', unit: 'pH' })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(options.body).toBe(
      JSON.stringify({ unit: 'ph', value: 8.2, measured_at: '2026-07-19T09:30:00Z' }),
    )
  })

  it('creates an alkalinity measurement with a lowercase "dkh" request unit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        request_id: 'req-alk-1',
        data: {
          id: 'm-alk-1',
          aquarium_id: 'aq-1',
          parameter: 'alkalinity',
          value: 8.5,
          unit: 'dKH',
          raw_value: 8.5,
          raw_unit: 'dkh',
          measured_at: '2026-07-19T09:30:00Z',
          created_at: '2026-07-19T09:31:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createAlkalinityMeasurement('aq-1', { value: 8.5, measuredAt: '2026-07-19T09:30:00Z' }),
    ).resolves.toMatchObject({ id: 'm-alk-1', unit: 'dKH' })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(options.body).toBe(
      JSON.stringify({ unit: 'dkh', value: 8.5, measured_at: '2026-07-19T09:30:00Z' }),
    )
  })

  it('deletes a measurement by parameter and id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-del-1',
        data: {
          id: 'm-ph-2',
          deleted: true,
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(deleteMeasurement('aq-1', 'phosphate', 'm-ph-2')).resolves.toBeUndefined()

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums/aq-1/measurements/phosphate/m-ph-2')
    expect(options.method).toBe('DELETE')
  })

  it('does not retry create request on 422 validation error', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ detail: 'invalid salinity value' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createSalinityMeasurement('aq-1', {
        value: -1,
        measuredAt: '2026-07-19T09:30:00Z',
      }),
    ).rejects.toMatchObject({ status: 422 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws when measurement list response shape is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, request_id: 'req-3', data: [{ id: 'm-1' }] }),
      }),
    )

    await expect(listSalinityMeasurements('aq-1')).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 502,
    })
  })
})
