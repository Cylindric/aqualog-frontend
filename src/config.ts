export type AuthMode = 'oauth' | 'none'

export interface RuntimeConfig {
  apiBaseUrl: string
  authMode: AuthMode
  oidcAuthority: string
  oidcClientId: string
  oidcRedirectUri: string
  oidcPostLogoutRedirectUri: string
  oidcScope: string
  appVersionDisplay: string
}

const DEFAULT_SCOPE = 'openid profile email'
const DEFAULT_VERSION_DISPLAY = 'unavailable'
const DEFAULT_AUTH_MODE: AuthMode = 'oauth'
const RUNTIME_CONFIG_PATH = '/api/runtime-config'
const DEV_FALLBACK_URL = 'http://localhost:8002/api/runtime-config'

export const config: RuntimeConfig = {
  apiBaseUrl: '',
  authMode: DEFAULT_AUTH_MODE,
  oidcAuthority: '',
  oidcClientId: '',
  oidcRedirectUri: '',
  oidcPostLogoutRedirectUri: '',
  oidcScope: DEFAULT_SCOPE,
  appVersionDisplay: DEFAULT_VERSION_DISPLAY,
}

let loadError = ''

interface RuntimeConfigResponse {
  AQUALOG_API_BASE_URL?: string
  AQUALOG_AUTH_MODE?: string
  AQUALOG_OAUTH_ISSUER_URL?: string
  AQUALOG_OAUTH_CLIENT_ID?: string
  AQUALOG_OIDC_REDIRECT_URI?: string
  AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI?: string
  AQUALOG_OAUTH_SCOPE?: string
  AQUALOG_APP_VERSION?: string
}

async function fetchRuntimeConfig(url: string): Promise<Response> {
  return fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
}

export async function loadRuntimeConfig(): Promise<void> {
  loadError = ''

  let response: Response
  try {
    response = await fetchRuntimeConfig(RUNTIME_CONFIG_PATH)
    if (!response.ok) {
      throw new Error(`Runtime config request failed: ${response.status} ${response.statusText}`)
    }
  } catch {
    try {
      response = await fetchRuntimeConfig(DEV_FALLBACK_URL)
      if (!response.ok) {
        throw new Error(`Runtime config request failed: ${response.status} ${response.statusText}`)
      }
    } catch {
      loadError = `Failed to load runtime config from ${RUNTIME_CONFIG_PATH} or ${DEV_FALLBACK_URL}`
      return
    }
  }

  let payload: RuntimeConfigResponse
  try {
    payload = (await response.json()) as RuntimeConfigResponse
  } catch {
    loadError = 'Runtime config endpoint returned invalid JSON'
    return
  }

  config.apiBaseUrl = payload.AQUALOG_API_BASE_URL ?? ''
  config.authMode = normalizeAuthMode(payload.AQUALOG_AUTH_MODE)
  config.oidcAuthority = payload.AQUALOG_OAUTH_ISSUER_URL ?? ''
  config.oidcClientId = payload.AQUALOG_OAUTH_CLIENT_ID ?? ''
  config.oidcRedirectUri = payload.AQUALOG_OIDC_REDIRECT_URI?? ''
  config.oidcPostLogoutRedirectUri = payload.AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI?? ''
  config.oidcScope = payload.AQUALOG_OAUTH_SCOPE ?? DEFAULT_SCOPE
  config.appVersionDisplay = normalizeVersionDisplay(payload.AQUALOG_APP_VERSION)
}

function normalizeAuthMode(mode: string | undefined): AuthMode {
  return mode === 'none' ? 'none' : DEFAULT_AUTH_MODE
}

function normalizeVersionDisplay(version: string | undefined): string {
  const normalized = version?.trim()
  if (!normalized) {
    return DEFAULT_VERSION_DISPLAY
  }

  return normalized.startsWith('v') ? normalized : `v${normalized}`
}

export function hasOidcConfig(): boolean {
  return (
    config.oidcAuthority.length > 0 &&
    config.oidcClientId.length > 0 &&
    config.oidcRedirectUri.length > 0 &&
    config.oidcPostLogoutRedirectUri.length > 0 &&
    config.oidcScope.length > 0
  )
}

export function isConfigured(): boolean {
  if (config.apiBaseUrl.length === 0) return false
  return config.authMode === 'none' || hasOidcConfig()
}

export function configErrors(): string[] {
  const errors: string[] = []
  if (loadError) errors.push(loadError)
  if (!config.apiBaseUrl) errors.push('AQUALOG_API_BASE_URL is not set')
  if (config.authMode === 'none') return errors
  if (!config.oidcAuthority) errors.push('AQUALOG_OAUTH_ISSUER_URL is not set')
  if (!config.oidcClientId) errors.push('AQUALOG_OAUTH_CLIENT_ID is not set')
  if (!config.oidcRedirectUri) errors.push('AQUALOG_OIDC_REDIRECT_URI is not set')
  if (!config.oidcPostLogoutRedirectUri) errors.push('AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI is not set')
  if (!config.oidcScope) errors.push('AQUALOG_OAUTH_SCOPE is not set')
  return errors
}
