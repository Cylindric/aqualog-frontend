import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { getThreshold, setThreshold } from '../../api/thresholds'
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

describe('thresholds api', () => {
  it('gets a threshold and maps response fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-1',
        data: {
          aquarium_id: 'aq-1',
          parameter: 'temperature',
          target: 25,
          min: 24,
          max: 26,
          unit: 'celsius',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getThreshold('aq-1', 'temperature')).resolves.toEqual({
      aquariumId: 'aq-1',
      parameter: 'temperature',
      target: 25,
      min: 24,
      max: 26,
      unit: 'celsius',
    })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums/aq-1/thresholds/temperature')
    expect(options.method).toBe('GET')
  })

  it('returns null fields when no threshold is configured yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          request_id: 'req-2',
          data: {
            aquarium_id: 'aq-1',
            parameter: 'salinity',
            target: null,
            min: null,
            max: null,
            unit: 'ppt',
          },
        }),
      }),
    )

    await expect(getThreshold('aq-1', 'salinity')).resolves.toEqual({
      aquariumId: 'aq-1',
      parameter: 'salinity',
      target: null,
      min: null,
      max: null,
      unit: 'ppt',
    })
  })

  it('sets a threshold with a PUT request and expected payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-3',
        data: {
          aquarium_id: 'aq-1',
          parameter: 'phosphate',
          target: 0.05,
          min: 0,
          max: 0.1,
          unit: 'ppm',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      setThreshold('aq-1', 'phosphate', { min: 0, target: 0.05, max: 0.1 }),
    ).resolves.toMatchObject({ parameter: 'phosphate', target: 0.05 })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums/aq-1/thresholds/phosphate')
    expect(options.method).toBe('PUT')
    expect(options.body).toBe(JSON.stringify({ min: 0, target: 0.05, max: 0.1 }))
  })

  it('rejects with validation errors on a 422 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: async () =>
          JSON.stringify({
            detail: [{ loc: ['body', 'max'], msg: 'max must be between 0 and 100', type: 'value_error' }],
          }),
      }),
    )

    await expect(
      setThreshold('aq-1', 'temperature', { min: 0, target: 20, max: 200 }),
    ).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 422,
      validationErrors: [{ loc: ['body', 'max'], msg: 'max must be between 0 and 100', type: 'value_error' }],
    })
  })

  it('throws when the threshold response shape is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, request_id: 'req-4', data: { aquarium_id: 'aq-1' } }),
      }),
    )

    await expect(getThreshold('aq-1', 'temperature')).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 502,
    })
  })
})
