import { describe, it, expect, vi } from 'vitest'
import { calculateSalinityDose, formatDoseResult } from '../../api/salinity'
import { setAccessTokenProvider, setRefreshAccessTokenProvider } from '../../api/client'

setAccessTokenProvider(() => 'test-token')
setRefreshAccessTokenProvider(() => 'test-token')

describe('formatDoseResult', () => {
  it('formats quantity in grams', () => {
    expect(formatDoseResult({ volume: 250, current: 34, target: 35, quantity: 275 })).toBe('275.0 g')
  })

  it('converts to kg when quantity >= 1000g', () => {
    expect(formatDoseResult({ volume: 250, current: 34, target: 35, quantity: 1500 })).toBe('1.500 kg')
  })
})

describe('calculateSalinityDose', () => {
  it('unwraps data payload and returns numeric values', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          request_id: 'c24cc8a3-8a8a-421c-90df-225c23f0890e',
          data: { volume: 250, current: 34, target: 35, quantity: 275 },
        }),
      }),
    )

    await expect(calculateSalinityDose({ volume: 250, current: 34, target: 35 })).resolves.toEqual({
      volume: 250,
      current: 34,
      target: 35,
      quantity: 275,
    })
  })

  it('throws when response does not match schema', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, request_id: 'abc', data: { volume: 250 } }),
      }),
    )

    await expect(calculateSalinityDose({ volume: 250, current: 34, target: 35 })).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 502,
      message: 'Received an unexpected salinity response shape from the API.',
    })
  })
})
