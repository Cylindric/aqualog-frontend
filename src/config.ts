export interface RuntimeConfig {
  apiBaseUrl: string
  oidcAuthority: string
  oidcClientId: string
  oidcRedirectUri: string
  oidcPostLogoutRedirectUri: string
  oidcScope: string
}

const DEFAULT_SCOPE = 'openid profile email'

export const config: RuntimeConfig = {
  apiBaseUrl: '',
  oidcAuthority: '',
  oidcClientId: '',
  oidcRedirectUri: '',
  oidcPostLogoutRedirectUri: '',
  oidcScope: DEFAULT_SCOPE,
}

let loadError = ''

interface RuntimeConfigResponse {
  VITE_API_BASE_URL?: string
  VITE_OIDC_AUTHORITY?: string
  VITE_OIDC_CLIENT_ID?: string
  VITE_OIDC_REDIRECT_URI?: string
  VITE_OIDC_POST_LOGOUT_REDIRECT_URI?: string
  VITE_OIDC_SCOPE?: string
}

export async function loadRuntimeConfig(): Promise<void> {
  loadError = ''

  let response: Response
  try {
    response = await fetch('/api/runtime-config', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
  } catch {
    loadError = 'Failed to load runtime config from /api/runtime-config'
    return
  }

  if (!response.ok) {
    loadError = `Runtime config request failed: ${response.status} ${response.statusText}`
    return
  }

  let payload: RuntimeConfigResponse
  try {
    payload = (await response.json()) as RuntimeConfigResponse
  } catch {
    loadError = 'Runtime config endpoint returned invalid JSON'
    return
  }

  config.apiBaseUrl = payload.VITE_API_BASE_URL ?? ''
  config.oidcAuthority = payload.VITE_OIDC_AUTHORITY ?? ''
  config.oidcClientId = payload.VITE_OIDC_CLIENT_ID ?? ''
  config.oidcRedirectUri = payload.VITE_OIDC_REDIRECT_URI ?? ''
  config.oidcPostLogoutRedirectUri = payload.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ?? ''
  config.oidcScope = payload.VITE_OIDC_SCOPE ?? DEFAULT_SCOPE
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
  return config.apiBaseUrl.length > 0 && hasOidcConfig()
}

export function configErrors(): string[] {
  const errors: string[] = []
  if (loadError) errors.push(loadError)
  if (!config.apiBaseUrl) errors.push('VITE_API_BASE_URL is not set')
  if (!config.oidcAuthority) errors.push('VITE_OIDC_AUTHORITY is not set')
  if (!config.oidcClientId) errors.push('VITE_OIDC_CLIENT_ID is not set')
  if (!config.oidcRedirectUri) errors.push('VITE_OIDC_REDIRECT_URI is not set')
  if (!config.oidcPostLogoutRedirectUri) errors.push('VITE_OIDC_POST_LOGOUT_REDIRECT_URI is not set')
  if (!config.oidcScope) errors.push('VITE_OIDC_SCOPE is not set')
  return errors
}
