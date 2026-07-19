import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSalinityMeasurement, listSalinityMeasurements } from '../../api/measurements'
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
