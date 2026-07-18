import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  createAquarium,
  deleteAquarium,
  listAquariums,
  updateAquarium,
} from '../../api/aquariums'
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

describe('aquariums api', () => {
  it('lists aquariums and maps response fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-1',
        data: [
          {
            id: 'aq-1',
            name: 'Reef Tank',
            type: 'Saltwater Reef',
            volume_liters: 284,
            created_at: '2026-07-18T10:00:00Z',
            updated_at: '2026-07-18T10:00:00Z',
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(listAquariums()).resolves.toEqual([
      {
        id: 'aq-1',
        name: 'Reef Tank',
        type: 'Saltwater Reef',
        volumeLiters: 284,
        createdAt: '2026-07-18T10:00:00Z',
        updatedAt: '2026-07-18T10:00:00Z',
      },
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums')
    expect(options.method).toBe('GET')
  })

  it('creates aquarium with expected payload and returns mapped record', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        request_id: 'req-2',
        data: {
          id: 'aq-2',
          name: 'Office Nano',
          type: 'Saltwater FOWLR',
          volume_liters: 76,
          created_at: '2026-07-18T11:00:00Z',
          updated_at: '2026-07-18T11:00:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createAquarium({
        name: 'Office Nano',
        type: 'Saltwater FOWLR',
        volume: { value: 20, unit: 'gal_us' },
      }),
    ).resolves.toMatchObject({ id: 'aq-2', volumeLiters: 76 })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(options.method).toBe('POST')
    expect(options.body).toBe(
      JSON.stringify({
        name: 'Office Nano',
        type: 'Saltwater FOWLR',
        volume: { value: 20, unit: 'gal_us' },
      }),
    )
  })

  it('does not retry create request on 422 validation error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => JSON.stringify({ detail: 'unsupported unit' }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(createAquarium({
      name: 'Office Nano',
      type: 'Saltwater FOWLR',
      volume: { value: 20, unit: 'gal_us' },
    })).rejects.toMatchObject({ status: 422 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('updates aquarium with patch payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-3',
        data: {
          id: 'aq-2',
          name: 'Office Nano Updated',
          type: 'Saltwater FOWLR',
          volume_liters: 80,
          created_at: '2026-07-18T11:00:00Z',
          updated_at: '2026-07-18T12:00:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      updateAquarium('aq-2', {
        name: 'Office Nano Updated',
        volume: { value: 80, unit: 'L' },
      }),
    ).resolves.toMatchObject({ id: 'aq-2', name: 'Office Nano Updated' })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums/aq-2')
    expect(options.method).toBe('PATCH')
  })

  it('deletes aquarium after successful delete response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-4',
        data: { id: 'aq-3', deleted: true },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(deleteAquarium('aq-3')).resolves.toBeUndefined()

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/aquariums/aq-3')
    expect(options.method).toBe('DELETE')
  })

  it('throws when aquarium response shape is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, request_id: 'req-5', data: { id: 'aq-1' } }),
      }),
    )

    await expect(listAquariums()).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 502,
    })
  })
})
