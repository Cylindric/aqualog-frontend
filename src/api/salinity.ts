import { ApiRequestError, apiGet } from './client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SalinityDoseParams {
  /** Tank volume in litres */
  volume: number
  /** Current salinity in parts per thousand (‰ PPT) */
  current: number
  /** Target salinity in parts per thousand (‰ PPT) */
  target: number
}

export interface SalinityDoseResponse {
  volume: number
  current: number
  target: number
  quantity: number
}

interface SalinityDoseApiResponse {
  success: boolean
  request_id: string
  data: SalinityDoseResponse
}

// ─── API call ────────────────────────────────────────────────────────────────

export async function calculateSalinityDose(
  params: SalinityDoseParams,
  signal?: AbortSignal,
): Promise<SalinityDoseResponse> {
  const response = await apiGet<unknown>(
    '/api/v1/calculate/dose/salinity',
    {
      volume: String(params.volume),
      current: String(params.current),
      target: String(params.target),
    },
    signal,
  )

  if (!isSalinityDoseApiResponse(response)) {
    throw new ApiRequestError(
      'Received an unexpected salinity response shape from the API.',
      502,
    )
  }

  return response.data
}

// ─── Result formatting ───────────────────────────────────────────────────────

function isSalinityDoseApiResponse(input: unknown): input is SalinityDoseApiResponse {
  if (typeof input !== 'object' || input === null) return false

  const obj = input as Record<string, unknown>
  if (typeof obj.success !== 'boolean') return false
  if (typeof obj.request_id !== 'string') return false
  if (typeof obj.data !== 'object' || obj.data === null) return false

  const data = obj.data as Record<string, unknown>
  return (
    typeof data.volume === 'number' &&
    typeof data.current === 'number' &&
    typeof data.target === 'number' &&
    typeof data.quantity === 'number'
  )
}

/**
 * Extracts and formats the primary dose value from the API response.
 * Tries well-known field names first, then falls back to the first numeric value.
 */
export function formatDoseResult(result: SalinityDoseResponse): string {
  return formatGrams(result.quantity)
}

function formatGrams(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(3)} kg`
  return `${value.toFixed(1)} g`
}
