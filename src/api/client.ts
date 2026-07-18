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

type ApiHttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface ApiRequestOptions {
  method?: ApiHttpMethod
  params?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
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
 * Performs an authenticated API request against the configured backend.
 * Throws ApiRequestError for non-2xx responses and TypeError for network failures.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET'
  const url = new URL(path, config.apiBaseUrl)
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value)
    }
  }

  const timeoutSignal = AbortSignal.timeout(10_000)
  const combinedSignal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal

  const runRequest = (token: string) =>
    fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
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
      const rawBody = await readResponseBody(response)
      const body = parsePossibleJson(rawBody)
      const validationErrors = extractValidationErrors(body)
      throw new ApiRequestError(
        validationErrors?.length
          ? validationErrors.map((item) => item.msg).join('; ')
          : rawBody.trim() || 'Validation error',
        response.status,
        validationErrors,
      )
    }
    throw new ApiRequestError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function readResponseBody(response: Response): Promise<string> {
  const maybeResponse = response as Response & {
    text?: () => Promise<string>
    json?: () => Promise<unknown>
  }

  if (typeof maybeResponse.text === 'function') {
    return maybeResponse.text().catch(() => '')
  }

  if (typeof maybeResponse.json === 'function') {
    const jsonBody = await maybeResponse.json().catch(() => ({}))
    return JSON.stringify(jsonBody)
  }

  return ''
}

function parsePossibleJson(raw: string): unknown {
  if (!raw.trim()) {
    return {}
  }

  try {
    return JSON.parse(raw) as unknown
  } catch {
    return { detail: raw }
  }
}

function extractValidationErrors(body: unknown): ValidationErrorItem[] | undefined {
  if (typeof body !== 'object' || body === null) {
    return undefined
  }

  const obj = body as Record<string, unknown>
  const detail = obj.detail ?? obj.errors ?? obj.error

  if (Array.isArray(detail)) {
    const parsed = detail
      .map((item) => {
        if (typeof item !== 'object' || item === null) return null
        const candidate = item as Record<string, unknown>

        const loc = Array.isArray(candidate.loc)
          ? candidate.loc.filter((entry): entry is string | number => typeof entry === 'string' || typeof entry === 'number')
          : []

        if (typeof candidate.msg !== 'string' || typeof candidate.type !== 'string') {
          return null
        }

        return {
          loc,
          msg: candidate.msg,
          type: candidate.type,
        } satisfies ValidationErrorItem
      })
      .filter((item): item is ValidationErrorItem => item !== null)

    return parsed.length > 0 ? parsed : undefined
  }

  if (typeof detail === 'string') {
    return [{ loc: [], msg: detail, type: 'validation_error' }]
  }

  if (typeof obj.message === 'string') {
    return [{ loc: [], msg: obj.message, type: 'validation_error' }]
  }

  if (typeof obj.error === 'string') {
    return [{ loc: [], msg: obj.error, type: 'validation_error' }]
  }

  return undefined
}

/**
 * Performs an authenticated GET request.
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', params, signal })
}

/**
 * Performs an authenticated POST request.
 */
export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, signal })
}

/**
 * Performs an authenticated PATCH request.
 */
export async function apiPatch<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', body, signal })
}

/**
 * Performs an authenticated DELETE request.
 */
export async function apiDelete<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE', signal })
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
