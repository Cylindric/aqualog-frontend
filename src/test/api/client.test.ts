import { describe, it, expect, vi, afterEach } from 'vitest'
import { ApiRequestError, toUserMessage } from '../../api/client'

vi.mock('../../config', () => ({
  config: { apiBaseUrl: 'http://localhost:8000', apiToken: 'test-token' },
  isConfigured: () => true,
  configErrors: () => [],
}))

// ─── toUserMessage ────────────────────────────────────────────────────────────

describe('toUserMessage', () => {
  it('returns auth message for 401', () => {
    const err = new ApiRequestError('Unauthorized', 401)
    expect(toUserMessage(err)).toMatch(/authentication failed/i)
  })

  it('returns auth message for 403', () => {
    const err = new ApiRequestError('Forbidden', 403)
    expect(toUserMessage(err)).toMatch(/authentication failed/i)
  })

  it('joins validation error messages', () => {
    const err = new ApiRequestError('Validation error', 422, [
      { loc: ['query', 'volume'], msg: 'value is not a valid float', type: 'type_error.float' },
    ])
    expect(toUserMessage(err)).toBe('value is not a valid float')
  })

  it('uses error message for other API errors', () => {
    const err = new ApiRequestError('Request failed: 500 Internal Server Error', 500)
    expect(toUserMessage(err)).toBe('Request failed: 500 Internal Server Error')
  })

  it('returns timeout message for DOMException TimeoutError', () => {
    const err = new DOMException('signal timed out', 'TimeoutError')
    expect(toUserMessage(err)).toMatch(/timed out/i)
  })

  it('returns network message for TypeError', () => {
    const err = new TypeError('Failed to fetch')
    expect(toUserMessage(err)).toMatch(/could not reach/i)
  })

  it('returns generic message for unknown errors', () => {
    expect(toUserMessage(new Error('random'))).toMatch(/unexpected error/i)
    expect(toUserMessage('string')).toMatch(/unexpected error/i)
  })
})

// ─── apiGet ───────────────────────────────────────────────────────────────────

describe('apiGet', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('returns parsed JSON on success', async () => {
    const { apiGet } = await import('../../api/client')
    const payload = { dose: 42.5 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    }))
    const result = await apiGet('/api/v1/calculate/dose/salinity', { volume: '100', current: '0', target: '35' })
    expect(result).toEqual(payload)
  })

  it('includes Authorization header', async () => {
    const { apiGet } = await import('../../api/client')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    await apiGet('/api/v1/test')
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token')
  })

  it('throws ApiRequestError for 422 with validation detail', async () => {
    const { apiGet } = await import('../../api/client')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({
        detail: [{ loc: ['query', 'volume'], msg: 'field required', type: 'missing' }],
      }),
    }))
    await expect(apiGet('/api/v1/test')).rejects.toMatchObject({
      status: 422,
      validationErrors: expect.arrayContaining([expect.objectContaining({ msg: 'field required' })]),
    })
  })

  it('throws ApiRequestError for other non-2xx responses', async () => {
    const { apiGet } = await import('../../api/client')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({}),
    }))
    await expect(apiGet('/api/v1/test')).rejects.toMatchObject({ status: 503 })
  })
})
