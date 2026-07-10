import { config } from '../config'

// ─── Error types ────────────────────────────────────────────────────────────

export interface ValidationErrorItem {
  loc: Array<string | number>
  msg: string
  type: string
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly validationErrors?: ValidationErrorItem[]

  constructor(message: string, status: number, validationErrors?: ValidationErrorItem[]) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.validationErrors = validationErrors
  }
}

export type AccessTokenProvider = () => string | null | Promise<string | null>
export type RefreshAccessTokenProvider = () => string | null | Promise<string | null>

let accessTokenProvider: AccessTokenProvider = () => null
let refreshAccessTokenProvider: RefreshAccessTokenProvider = () => null

export function setAccessTokenProvider(provider: AccessTokenProvider): void {
  accessTokenProvider = provider
}

export function setRefreshAccessTokenProvider(provider: RefreshAccessTokenProvider): void {
  refreshAccessTokenProvider = provider
}

async function getAccessToken(): Promise<string> {
  const token = await accessTokenProvider()
  if (!token) {
    throw new ApiRequestError('No authenticated session is available.', 401)
  }
  return token
}

// ─── HTTP client ─────────────────────────────────────────────────────────────

/**
 * Performs an authenticated GET request against the configured API base URL.
 * Throws ApiRequestError for non-2xx responses and TypeError for network failures.
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(path, config.apiBaseUrl)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const timeoutSignal = AbortSignal.timeout(10_000)
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal

  const runRequest = (token: string) =>
    fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: combinedSignal,
    })

  let accessToken: string
  try {
    accessToken = await getAccessToken()
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401) {
      throw error
    }

    const refreshedToken = await refreshAccessTokenProvider()
    if (!refreshedToken) {
      throw error
    }
    accessToken = refreshedToken
  }

  let response = await runRequest(accessToken)

  if (response.status === 401) {
    const refreshedToken = await refreshAccessTokenProvider()
    if (refreshedToken) {
      response = await runRequest(refreshedToken)
    }
  }

  if (!response.ok) {
    if (response.status === 422) {
      const body = (await response.json().catch(() => ({}))) as {
        detail?: ValidationErrorItem[]
      }
      throw new ApiRequestError('Validation error', response.status, body.detail)
    }
    throw new ApiRequestError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
    )
  }

  return response.json() as Promise<T>
}

/**
 * Calls the readiness endpoint (no auth required) to verify backend availability.
 * Throws ApiRequestError or TypeError on failure.
 */
export async function checkReadiness(signal?: AbortSignal): Promise<void> {
  const url = new URL('/api/v1/ready', config.apiBaseUrl)
  const timeoutSignal = AbortSignal.timeout(5_000)
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal

  const response = await fetch(url.toString(), { signal: combinedSignal })
  if (!response.ok) {
    throw new ApiRequestError('Backend is not ready', response.status)
  }
}

// ─── Error message helper ────────────────────────────────────────────────────

/**
 * Extracts a user-friendly error message from any thrown value.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401 || error.status === 403) {
      return 'Authentication failed. Please sign in again.'
    }
    if (error.validationErrors?.length) {
      return error.validationErrors.map((v) => v.msg).join('; ')
    }
    return error.message
  }
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return 'The request timed out. Check your network connection and API URL.'
  }
  if (error instanceof TypeError) {
    return 'Could not reach the backend. Check your network connection and API URL.'
  }
  return 'An unexpected error occurred. Please try again.'
}
