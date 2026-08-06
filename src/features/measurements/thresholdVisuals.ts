import type { ThresholdRecord } from '../../api/thresholds'

export interface ThresholdReferenceLine {
  y: number
  label: string
  color: string
  labelPosition?: 'insideTopLeft' | 'insideBottomLeft'
}

export interface ThresholdVisuals {
  gradientStops?: { offset: number; color: string }[]
  referenceLines?: ThresholdReferenceLine[]
  yDomainMin: number
  yDomainMax: number
}

export function computeThresholdVisuals(
  threshold: ThresholdRecord | null,
  values: number[],
  parameterLabel: string,
  formatValue: (value: number) => string,
): ThresholdVisuals {
  const min = threshold?.min ?? null
  const target = threshold?.target ?? null
  const max = threshold?.max ?? null

  const boundValues = [min, target, max].filter((value): value is number => value !== null)
  const yDomainMin = Math.min(...values, ...boundValues)
  const yDomainMax = Math.max(...values, ...boundValues)

  const referenceLineCandidates = [
    target !== null
      ? { y: target, label: `Target ${parameterLabel} (${formatValue(target)})`, color: 'accent.4' }
      : null,
    min !== null
      ? {
          y: min,
          label: `Min ${parameterLabel} (${formatValue(min)})`,
          color: 'red.7',
          labelPosition: 'insideBottomLeft' as const,
        }
      : null,
    max !== null
      ? {
          y: max,
          label: `Max ${parameterLabel} (${formatValue(max)})`,
          color: 'red.7',
          labelPosition: 'insideTopLeft' as const,
        }
      : null,
  ].filter((line): line is ThresholdReferenceLine => line !== null)
  const referenceLines = referenceLineCandidates.length > 0 ? referenceLineCandidates : undefined

  if (min === null && max === null) {
    return { referenceLines, yDomainMin, yDomainMax }
  }

  const yRange = yDomainMax - yDomainMin
  const offsetForValue = (value: number): number => {
    if (yRange <= 0) return 50
    return Math.min(100, Math.max(0, ((yDomainMax - value) / yRange) * 100))
  }

  // The safe zone is uniformly green between min and max (with no fade toward
  // target); only the offset itself flips to red, so each threshold gets two
  // stops at the same offset to create a hard edge instead of a gradual blend.
  const gradientStops = [
    ...(max !== null
      ? [
          { offset: 0, color: 'red.7' },
          { offset: offsetForValue(max), color: 'red.7' },
          { offset: offsetForValue(max), color: 'green.6' },
        ]
      : [{ offset: 0, color: 'green.6' }]),
    ...(min !== null
      ? [
          { offset: offsetForValue(min), color: 'green.6' },
          { offset: offsetForValue(min), color: 'red.7' },
          { offset: 100, color: 'red.7' },
        ]
      : [{ offset: 100, color: 'green.6' }]),
  ]

  return { gradientStops, referenceLines, yDomainMin, yDomainMax }
}
