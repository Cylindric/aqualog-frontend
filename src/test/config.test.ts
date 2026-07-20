import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config, configErrors, loadRuntimeConfig } from '../config'

describe('runtime config loading', () => {
  beforeEach(() => {
    config.apiBaseUrl = ''
    config.oidcAuthority = ''
    config.oidcClientId = ''
    config.oidcRedirectUri = ''
    config.oidcPostLogoutRedirectUri = ''
    config.oidcScope = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps runtime payload fields into config object using OIDC redirect keys', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        AQUALOG_API_BASE_URL: 'https://api.example.test',
        AQUALOG_OAUTH_ISSUER_URL: 'https://auth.example.test/application/o/aqualog-spa/',
        AQUALOG_OAUTH_CLIENT_ID: 'client-123',
        AQUALOG_OIDC_REDIRECT_URI: 'https://app.example.test/auth/callback',
        AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI: 'https://app.example.test',
        AQUALOG_OAUTH_SCOPE: 'openid profile email offline_access',
      }),
    }))

    await loadRuntimeConfig()

    expect(config.apiBaseUrl).toBe('https://api.example.test')
    expect(config.oidcAuthority).toBe('https://auth.example.test/application/o/aqualog-spa/')
    expect(config.oidcClientId).toBe('client-123')
    expect(config.oidcRedirectUri).toBe('https://app.example.test/auth/callback')
    expect(config.oidcPostLogoutRedirectUri).toBe('https://app.example.test')
    expect(config.oidcScope).toBe('openid profile email offline_access')
  })

  it('reports missing OIDC runtime keys with correct key names', () => {
    expect(configErrors()).toContain('AQUALOG_OIDC_REDIRECT_URI is not set')
    expect(configErrors()).toContain('AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI is not set')
  })
})
