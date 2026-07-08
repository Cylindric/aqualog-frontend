/**
 * Runtime configuration read from Vite environment variables.
 * Both values are deployment-configured only; they cannot be changed by end users at runtime.
 *
 * Security note: VITE_ prefixed vars are bundled into the client JS. Only deploy to trusted
 * networks where bundling the API token is an acceptable trade-off (e.g. self-hosted home network).
 */
export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '',
  apiToken: (import.meta.env.VITE_API_TOKEN as string | undefined) ?? '',
} as const

export function isConfigured(): boolean {
  return config.apiBaseUrl.length > 0 && config.apiToken.length > 0
}

export function configErrors(): string[] {
  const errors: string[] = []
  if (!config.apiBaseUrl) errors.push('VITE_API_BASE_URL is not set')
  if (!config.apiToken) errors.push('VITE_API_TOKEN is not set')
  return errors
}
