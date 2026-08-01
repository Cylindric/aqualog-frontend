import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config, configErrors, isConfigured, loadRuntimeConfig } from '../config'

describe('runtime config loading', () => {
  beforeEach(() => {
    config.apiBaseUrl = ''
    config.authMode = 'oauth'
    config.oidcAuthority = ''
    config.oidcClientId = ''
    config.oidcRedirectUri = ''
    config.oidcPostLogoutRedirectUri = ''
    config.oidcScope = ''
    config.appVersionDisplay = ''
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
        AQUALOG_APP_VERSION: 'v1.6.0',
      }),
    }))

    await loadRuntimeConfig()

    expect(config.apiBaseUrl).toBe('https://api.example.test')
    expect(config.oidcAuthority).toBe('https://auth.example.test/application/o/aqualog-spa/')
    expect(config.oidcClientId).toBe('client-123')
    expect(config.oidcRedirectUri).toBe('https://app.example.test/auth/callback')
    expect(config.oidcPostLogoutRedirectUri).toBe('https://app.example.test')
    expect(config.oidcScope).toBe('openid profile email offline_access')
    expect(config.appVersionDisplay).toBe('v1.6.0')
  })

  it('uses unavailable fallback when app version is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        AQUALOG_API_BASE_URL: 'https://api.example.test',
        AQUALOG_OAUTH_ISSUER_URL: 'https://auth.example.test/application/o/aqualog-spa/',
        AQUALOG_OAUTH_CLIENT_ID: 'client-123',
        AQUALOG_OIDC_REDIRECT_URI: 'https://app.example.test/auth/callback',
        AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI: 'https://app.example.test',
      }),
    }))

    await loadRuntimeConfig()

    expect(config.appVersionDisplay).toBe('unavailable')
  })

  it('preserves v prefix when already present in runtime config', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        AQUALOG_API_BASE_URL: 'https://api.example.test',
        AQUALOG_OAUTH_ISSUER_URL: 'https://auth.example.test/application/o/aqualog-spa/',
        AQUALOG_OAUTH_CLIENT_ID: 'client-123',
        AQUALOG_OIDC_REDIRECT_URI: 'https://app.example.test/auth/callback',
        AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI: 'https://app.example.test',
        AQUALOG_APP_VERSION: 'v1.6.0',
      }),
    }))

    await loadRuntimeConfig()

    expect(config.appVersionDisplay).toBe('v1.6.0')
  })

  it('reports missing OIDC runtime keys with correct key names', () => {
    expect(configErrors()).toContain('AQUALOG_OIDC_REDIRECT_URI is not set')
    expect(configErrors()).toContain('AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI is not set')
  })

  it('defaults auth mode to oauth when not provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ AQUALOG_API_BASE_URL: 'https://api.example.test' }),
    }))

    await loadRuntimeConfig()

    expect(config.authMode).toBe('oauth')
  })

  it('falls back to oauth for an unrecognized auth mode value', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        AQUALOG_API_BASE_URL: 'https://api.example.test',
        AQUALOG_AUTH_MODE: 'bogus',
      }),
    }))

    await loadRuntimeConfig()

    expect(config.authMode).toBe('oauth')
  })

  it('parses auth mode none from runtime config', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        AQUALOG_API_BASE_URL: 'https://api.example.test',
        AQUALOG_AUTH_MODE: 'none',
      }),
    }))

    await loadRuntimeConfig()

    expect(config.authMode).toBe('none')
  })

  it('is configured without OIDC keys when auth mode is none', () => {
    config.apiBaseUrl = 'https://api.example.test'
    config.authMode = 'none'

    expect(isConfigured()).toBe(true)
    expect(configErrors()).toEqual([])
  })

  it('is not configured when auth mode is none but API base URL is missing', () => {
    config.apiBaseUrl = ''
    config.authMode = 'none'

    expect(isConfigured()).toBe(false)
    expect(configErrors()).toContain('AQUALOG_API_BASE_URL is not set')
  })
})
