import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { getMyProfile, isAquaLogAdmin, updateMyProfile } from '../../api/profile'
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

describe('profile api', () => {
  it('fetches the current user profile', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-1',
        data: {
          id: 'user-1',
          username: 'reefer',
          display_name: 'Reefer',
          bio: null,
          created_at: '2026-07-18T10:00:00Z',
          updated_at: '2026-07-18T10:00:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getMyProfile()).resolves.toEqual({
      id: 'user-1',
      username: 'reefer',
      display_name: 'Reefer',
      bio: null,
      created_at: '2026-07-18T10:00:00Z',
      updated_at: '2026-07-18T10:00:00Z',
      groups: [],
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/me')
    expect(options.method).toBe('GET')
  })

  it('parses groups from the profile response and reports admin status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-1',
        data: {
          id: 'user-1',
          username: 'reefer',
          display_name: 'Reefer',
          bio: null,
          created_at: '2026-07-18T10:00:00Z',
          updated_at: '2026-07-18T10:00:00Z',
          groups: ['AquaLogAdmins', 'Everyone'],
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const profile = await getMyProfile()
    expect(profile.groups).toEqual(['AquaLogAdmins', 'Everyone'])
    expect(isAquaLogAdmin(profile)).toBe(true)
  })

  it('treats a missing groups field as no groups and not an admin', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-1',
        data: {
          id: 'user-1',
          username: 'reefer',
          display_name: 'Reefer',
          bio: null,
          created_at: '2026-07-18T10:00:00Z',
          updated_at: '2026-07-18T10:00:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const profile = await getMyProfile()
    expect(profile.groups).toEqual([])
    expect(isAquaLogAdmin(profile)).toBe(false)
  })

  it('updates the display name with a patch payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        request_id: 'req-2',
        data: {
          id: 'user-1',
          username: 'reefer',
          display_name: 'Updated Name',
          bio: null,
          created_at: '2026-07-18T10:00:00Z',
          updated_at: '2026-07-18T12:00:00Z',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(updateMyProfile({ display_name: 'Updated Name' })).resolves.toMatchObject({
      display_name: 'Updated Name',
    })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/me')
    expect(options.method).toBe('PATCH')
    expect(options.body).toBe(JSON.stringify({ display_name: 'Updated Name' }))
  })

  it('propagates errors from a failed update', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ detail: 'display_name too long' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(updateMyProfile({ display_name: 'x'.repeat(200) })).rejects.toMatchObject({
      status: 422,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws when the profile response shape is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, request_id: 'req-3', data: { id: 'user-1' } }),
      }),
    )

    await expect(getMyProfile()).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 502,
    })
  })
})
