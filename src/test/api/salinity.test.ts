import { describe, it, expect } from 'vitest'
import { formatDoseResult } from '../../api/salinity'

describe('formatDoseResult', () => {
  it('formats dose field in grams', () => {
    expect(formatDoseResult({ dose: 150.5 })).toBe('150.5 g')
  })

  it('converts to kg when dose >= 1000g', () => {
    expect(formatDoseResult({ dose: 1500 })).toBe('1.500 kg')
  })

  it('falls back to dose_grams field name', () => {
    expect(formatDoseResult({ dose_grams: 75.2 })).toBe('75.2 g')
  })

  it('falls back to first numeric value if no known key', () => {
    expect(formatDoseResult({ result: 200.0 })).toBe('200.0 g')
  })

  it('falls back to JSON string if no numeric values', () => {
    // @ts-expect-error - intentionally passing non-numeric for test coverage
    expect(formatDoseResult({ message: 'ok' })).toBe(JSON.stringify({ message: 'ok' }))
  })
})
