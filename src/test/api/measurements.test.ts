import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMeasurementByParameter,
  deleteMeasurement,
  listMeasurementsByParameter,
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
  it('lists measurements for a parameter and maps payload fields', async () => {
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

    await expect(listMeasurementsByParameter('aq-1', 'salinity')).resolves.toEqual([
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

  it('creates a measurement using the unit supplied by the caller', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        request_id: 'req-2',
        data: {
          id: 'm-2',
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
      createMeasurementByParameter('aq-1', 'ammonia', {
        value: 0.25,
        unit: 'mg/l',
        measuredAt: '2026-07-19T09:30:00Z',
      }),
    ).resolves.toMatchObject({ id: 'm-2', unit: 'mg/L' })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums/aq-1/measurements/ammonia')
    expect(options.method).toBe('POST')
    expect(options.body).toBe(
      JSON.stringify({
        unit: 'mg/l',
        value: 0.25,
        measured_at: '2026-07-19T09:30:00Z',
      }),
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
      createMeasurementByParameter('aq-1', 'salinity', {
        value: -1,
        unit: 'ppt',
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

    await expect(listMeasurementsByParameter('aq-1', 'salinity')).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 502,
    })
  })
})
