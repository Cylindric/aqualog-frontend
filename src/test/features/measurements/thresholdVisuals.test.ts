import { describe, expect, it } from 'vitest'
import { computeThresholdVisuals } from '../../../features/measurements/thresholdVisuals'
import type { ThresholdRecord } from '../../../api/thresholds'

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

  it('shades red only outside min/max, with a hard edge instead of a gradual fade toward target', () => {
    // yDomainMin=25, yDomainMax=45 -> max(40) is at offset 25, min(30) is at offset 75
    const visuals = computeThresholdVisuals(
      threshold({ target: 35, min: 30, max: 40 }),
      [25, 45],
      'Salinity',
      String,
    )
    expect(visuals.gradientStops).toEqual([
      { offset: 0, color: 'red.7' },
      { offset: 25, color: 'red.7' },
      { offset: 25, color: 'green.6' },
      { offset: 75, color: 'green.6' },
      { offset: 75, color: 'red.7' },
      { offset: 100, color: 'red.7' },
    ])
  })

  it('shades green everywhere below max when there is no min', () => {
    // yDomainMin=30, yDomainMax=50 -> max(40) is at offset 50
    const visuals = computeThresholdVisuals(threshold({ max: 40 }), [30, 50], 'Salinity', String)
    expect(visuals.gradientStops).toEqual([
      { offset: 0, color: 'red.7' },
      { offset: 50, color: 'red.7' },
      { offset: 50, color: 'green.6' },
      { offset: 100, color: 'green.6' },
    ])
  })

  it('shades green everywhere above min when there is no max', () => {
    // yDomainMin=20, yDomainMax=40 -> min(30) is at offset 50
    const visuals = computeThresholdVisuals(threshold({ min: 30 }), [20, 40], 'Salinity', String)
    expect(visuals.gradientStops).toEqual([
      { offset: 0, color: 'green.6' },
      { offset: 50, color: 'green.6' },
      { offset: 50, color: 'red.7' },
      { offset: 100, color: 'red.7' },
    ])
  })
})
