import { describe, expect, it } from 'vitest'
import { computeThresholdVisuals } from '../../pages/MeasurementsPage'
import type { ThresholdRecord } from '../../api/thresholds'

function threshold(overrides: Partial<ThresholdRecord>): ThresholdRecord {
  return {
    aquariumId: 'aq-1',
    parameter: 'salinity',
    target: null,
    min: null,
    max: null,
    unit: 'ppt',
    ...overrides,
  }
}

describe('computeThresholdVisuals', () => {
  it('returns no reference lines when there is no threshold', () => {
    const visuals = computeThresholdVisuals(null, [1, 2, 3], 'Salinity', String)
    expect(visuals.referenceLines).toBeUndefined()
  })

  it('includes a target reference line only when target is set', () => {
    const visuals = computeThresholdVisuals(threshold({ target: 35 }), [30, 40], 'Salinity', String)
    expect(visuals.referenceLines).toEqual([{ y: 35, label: 'Target Salinity (35)', color: 'accent.4' }])
  })

  it('includes min and max reference lines alongside target', () => {
    const visuals = computeThresholdVisuals(
      threshold({ target: 35, min: 30, max: 40 }),
      [25, 45],
      'Salinity',
      String,
    )
    expect(visuals.referenceLines).toEqual([
      { y: 35, label: 'Target Salinity (35)', color: 'accent.4' },
      { y: 30, label: 'Min Salinity (30)', color: 'red.7', labelPosition: 'insideBottomLeft' },
      { y: 40, label: 'Max Salinity (40)', color: 'red.7', labelPosition: 'insideTopLeft' },
    ])
  })

  it('includes min/max reference lines even when target is unset', () => {
    const visuals = computeThresholdVisuals(threshold({ min: 30, max: 40 }), [25, 45], 'Salinity', String)
    expect(visuals.referenceLines).toEqual([
      { y: 30, label: 'Min Salinity (30)', color: 'red.7', labelPosition: 'insideBottomLeft' },
      { y: 40, label: 'Max Salinity (40)', color: 'red.7', labelPosition: 'insideTopLeft' },
    ])
  })

  it('includes only a min reference line when max is unset', () => {
    const visuals = computeThresholdVisuals(threshold({ min: 30 }), [25, 45], 'Salinity', String)
    expect(visuals.referenceLines).toEqual([
      { y: 30, label: 'Min Salinity (30)', color: 'red.7', labelPosition: 'insideBottomLeft' },
    ])
  })
})
