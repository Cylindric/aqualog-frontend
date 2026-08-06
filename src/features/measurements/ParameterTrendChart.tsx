import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Card, Skeleton, Stack, Text } from '@mantine/core'
import { LineChart } from '@mantine/charts'
import type { ParameterConfig } from '../../api/parameters'
import type { MeasurementRecord } from '../../api/measurements'
import type { ThresholdRecord } from '../../api/thresholds'
import { computeThresholdVisuals } from './thresholdVisuals'

export function ParameterTrendChart({
  parameter,
  measurements,
  threshold,
  showEmpty,
}: {
  parameter: ParameterConfig
  measurements: MeasurementRecord[]
  threshold: ThresholdRecord | null
  showEmpty: boolean
}) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const [canRenderChart, setCanRenderChart] = useState(false)

  useEffect(() => {
    const element = chartContainerRef.current
    if (!element) return

    const updateChartVisibility = () => {
      const { width, height } = element.getBoundingClientRect()
      setCanRenderChart(width > 0 && height > 0)
    }

    updateChartVisibility()

    const observer = new ResizeObserver(() => {
      updateChartVisibility()
    })
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  if (measurements.length < 2) {
    if (!showEmpty) return null

    return (
      <Alert color="gray" title={`${parameter.displayName} trend unavailable`}>
        <Text size="sm">
          At least two {parameter.displayName.toLowerCase()} measurements are needed to render a trend line.
        </Text>
      </Alert>
    )
  }

  const ordered = [...measurements].sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt))
  const chartData = ordered.map((item) => ({
    measuredAt: formatShortDate(item.measuredAt),
    [parameter.slug]: item.value,
  }))
  const values = chartData.map((item) => item[parameter.slug] as number)
  const visuals = computeThresholdVisuals(threshold, values, parameter.displayName, (value) => String(value))

  return (
    <Card withBorder>
      <Card.Section p="md">
        <Stack gap="xs">
          <Text fw={600}>{parameter.displayName} Trend ({parameter.unit})</Text>
          <Text c="dimmed" size="sm">
            Displaying all recorded {parameter.displayName.toLowerCase()} measurements for the selected aquarium.
          </Text>
          <Box ref={chartContainerRef} mih={240}>
            {canRenderChart ? (
              <LineChart
                h={240}
                data={chartData}
                dataKey="measuredAt"
                type={visuals.gradientStops ? 'gradient' : 'default'}
                gradientStops={visuals.gradientStops}
                yAxisProps={{ domain: [visuals.yDomainMin, visuals.yDomainMax] }}
                referenceLines={visuals.referenceLines}
                series={[{ name: parameter.slug, label: parameter.displayName }]}
                curveType="monotone"
                withDots
                withLegend
                unit={` ${parameter.unit}`}
                tooltipAnimationDuration={200}
              />
            ) : (
              <Skeleton h={240} />
            )}
          </Box>
        </Stack>
      </Card.Section>
    </Card>
  )
}

function formatShortDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
