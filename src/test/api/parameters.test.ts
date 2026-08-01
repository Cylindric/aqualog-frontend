import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listParameters } from '../../api/parameters'
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

describe('parameters api', () => {
  it('lists the parameter catalog and maps payload fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-1',
        data: [
          {
            slug: 'salinity',
            display_name: 'Salinity',
            description: 'Salt concentration of aquarium water, measured in ppt.',
            unit: 'ppt',
            created_at: '2026-07-18T10:00:00Z',
            updated_at: '2026-07-18T10:00:00Z',
          },
          {
            slug: 'temperature',
            display_name: 'Temperature',
            description: null,
            unit: 'celsius',
            created_at: '2026-07-18T10:00:00Z',
            updated_at: '2026-07-18T10:00:00Z',
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(listParameters()).resolves.toEqual([
      {
        slug: 'salinity',
        displayName: 'Salinity',
        description: 'Salt concentration of aquarium water, measured in ppt.',
        unit: 'ppt',
        createdAt: '2026-07-18T10:00:00Z',
        updatedAt: '2026-07-18T10:00:00Z',
      },
      {
        slug: 'temperature',
        displayName: 'Temperature',
        description: null,
        unit: 'celsius',
        createdAt: '2026-07-18T10:00:00Z',
        updatedAt: '2026-07-18T10:00:00Z',
      },
    ])

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/parameters')
    expect(options.method).toBe('GET')
  })

  it('throws when parameter list response shape is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, request_id: 'req-2', data: [{ slug: 'salinity' }] }),
      }),
    )

    await expect(listParameters()).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 502,
    })
  })
})
