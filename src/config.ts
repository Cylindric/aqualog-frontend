/**
 * Runtime configuration read from Vite environment variables.
 * Values are deployment-configured only; they cannot be changed by end users at runtime.
 *
 * Security note: VITE_ prefixed vars are bundled into the client JS.
 */
export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '',
  oidcAuthority: (import.meta.env.VITE_OIDC_AUTHORITY as string | undefined) ?? '',
  oidcClientId: (import.meta.env.VITE_OIDC_CLIENT_ID as string | undefined) ?? '',
  oidcRedirectUri: (import.meta.env.VITE_OIDC_REDIRECT_URI as string | undefined) ?? '',
  oidcPostLogoutRedirectUri:
    (import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI as string | undefined) ?? '',
  oidcScope: (import.meta.env.VITE_OIDC_SCOPE as string | undefined) ?? 'openid profile email',
} as const

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
  if (!config.apiBaseUrl) errors.push('VITE_API_BASE_URL is not set')
  if (!config.oidcAuthority) errors.push('VITE_OIDC_AUTHORITY is not set')
  if (!config.oidcClientId) errors.push('VITE_OIDC_CLIENT_ID is not set')
  if (!config.oidcRedirectUri) errors.push('VITE_OIDC_REDIRECT_URI is not set')
  if (!config.oidcPostLogoutRedirectUri) errors.push('VITE_OIDC_POST_LOGOUT_REDIRECT_URI is not set')
  if (!config.oidcScope) errors.push('VITE_OIDC_SCOPE is not set')
  return errors
}
