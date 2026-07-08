import { apiGet } from './client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SalinityDoseParams {
  /** Tank volume in litres */
  volume: number
  /** Current salinity in parts per thousand (‰ PPT) */
  current: number
  /** Target salinity in parts per thousand (‰ PPT) */
  target: number
}

/**
 * The API response shape is not formally documented in the OpenAPI spec ({}).
 * We accept any object with numeric values and extract the dose at render time.
 */
export type SalinityDoseResponse = Record<string, number>

// ─── API call ────────────────────────────────────────────────────────────────

export async function calculateSalinityDose(
  params: SalinityDoseParams,
  signal?: AbortSignal,
): Promise<SalinityDoseResponse> {
  return apiGet<SalinityDoseResponse>(
    '/api/v1/calculate/dose/salinity',
    {
      volume: String(params.volume),
      current: String(params.current),
      target: String(params.target),
    },
    signal,
  )
}

// ─── Result formatting ───────────────────────────────────────────────────────

const KNOWN_DOSE_KEYS = ['dose', 'dose_grams', 'grams', 'amount', 'salt', 'salt_dose', 'quantity']

/**
 * Extracts and formats the primary dose value from the API response.
 * Tries well-known field names first, then falls back to the first numeric value.
 */
export function formatDoseResult(result: SalinityDoseResponse): string {
  for (const key of KNOWN_DOSE_KEYS) {
    if (typeof result[key] === 'number') {
      return formatGrams(result[key])
    }
  }
  // Fallback: use first numeric value
  for (const val of Object.values(result)) {
    if (typeof val === 'number') return formatGrams(val)
  }
  return JSON.stringify(result)
}

function formatGrams(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(3)} kg`
  return `${value.toFixed(1)} g`
}
