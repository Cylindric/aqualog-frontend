import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Grid,
  Group,
  NumberInput,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { LineChart } from '@mantine/charts'
import { type AquariumRecord, listAquariums } from '../api/aquariums'
import {
  createPhosphateMeasurement,
  createSalinityMeasurement,
  deleteMeasurement,
  listPhosphateMeasurements,
  listSalinityMeasurements,
  type MeasurementParameter,
  type MeasurementRecord,
} from '../api/measurements'
import { ApiRequestError, toUserMessage } from '../api/client'

type MeasurementsViewState = 'idle' | 'loading' | 'ready' | 'error'

interface MeasurementFormValues {
  salinityValue: number | ''
  phosphateValue: number | ''
  measuredAtLocal: string
}

interface LastDeleteAttempt {
  id: string
  parameter: MeasurementParameter
}

function defaultFormValues(): MeasurementFormValues {
  return {
    salinityValue: '',
    phosphateValue: '',
    measuredAtLocal: new Date().toISOString().slice(0, 16),
  }
}

export function MeasurementsPage() {
  const [aquariums, setAquariums] = useState<AquariumRecord[]>([])
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(null)
  const [aquariumsLoading, setAquariumsLoading] = useState(true)
  const [aquariumsError, setAquariumsError] = useState('')

  const [viewState, setViewState] = useState<MeasurementsViewState>('idle')
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([])
  const [historyError, setHistoryError] = useState('')

  const [formValues, setFormValues] = useState<MeasurementFormValues>(defaultFormValues())
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MeasurementFormValues, string>>>({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [lastSubmit, setLastSubmit] = useState<MeasurementFormValues | null>(null)

  const [deletingMeasurementId, setDeletingMeasurementId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [lastDeleteAttempt, setLastDeleteAttempt] = useState<LastDeleteAttempt | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void loadAquariums(controller.signal)

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!selectedAquariumId) {
      setMeasurements([])
      setViewState('idle')
      return
    }

    const controller = new AbortController()
    void loadMeasurements(selectedAquariumId, controller.signal)
    return () => {
      controller.abort()
    }
  }, [selectedAquariumId])

  const sortedMeasurements = useMemo(
    () => [...measurements].sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt)),
    [measurements],
  )

  const salinityMeasurements = useMemo(
    () => sortedMeasurements.filter((measurement) => measurement.parameter === 'salinity'),
    [sortedMeasurements],
  )

  const phosphateMeasurements = useMemo(
    () => sortedMeasurements.filter((measurement) => measurement.parameter === 'phosphate'),
    [sortedMeasurements],
  )

  const aquariumOptions = useMemo(
    () => aquariums.map((aquarium) => ({ value: aquarium.id, label: aquarium.name })),
    [aquariums],
  )

  const handleRetryAquariums = () => {
    void loadAquariums()
  }

  const handleRetryHistory = () => {
    if (!selectedAquariumId) return
    void loadMeasurements(selectedAquariumId)
  }

  const handleRetryCreate = () => {
    if (!selectedAquariumId || !lastSubmit) return
    void submitMeasurement(lastSubmit)
  }

  const handleRetryDelete = () => {
    if (!selectedAquariumId || !lastDeleteAttempt) return
    void handleDeleteMeasurement(lastDeleteAttempt.id, lastDeleteAttempt.parameter)
  }

  const handleFormSubmit = async () => {
    const validation = validateMeasurement(formValues)
    if (Object.keys(validation).length > 0) {
      setFormErrors(validation)
      return
    }

    await submitMeasurement(formValues)
  }

  async function submitMeasurement(values: MeasurementFormValues) {
    if (!selectedAquariumId) {
      setSubmitError('Select an aquarium before submitting a measurement.')
      return
    }

    setSaving(true)
    setSubmitError('')
    setFormErrors({})
    setLastSubmit(values)

    const nextErrors: Partial<Record<keyof MeasurementFormValues, string>> = {}
    const failureMessages: string[] = []
    let savedCount = 0

    try {
      if (values.salinityValue !== '') {
        try {
          await createSalinityMeasurement(selectedAquariumId, {
            value: Number(values.salinityValue),
            measuredAt: toIsoString(values.measuredAtLocal),
          })
          savedCount += 1
        } catch (error) {
          failureMessages.push(`Salinity: ${toUserMessage(error)}`)
          if (error instanceof ApiRequestError && error.validationErrors?.length) {
            Object.assign(nextErrors, mapApiValidationErrors(error, 'salinityValue'))
          }
        }
      }

      if (values.phosphateValue !== '') {
        try {
          await createPhosphateMeasurement(selectedAquariumId, {
            value: Number(values.phosphateValue),
            measuredAt: toIsoString(values.measuredAtLocal),
          })
          savedCount += 1
        } catch (error) {
          failureMessages.push(`Phosphate: ${toUserMessage(error)}`)
          if (error instanceof ApiRequestError && error.validationErrors?.length) {
            Object.assign(nextErrors, mapApiValidationErrors(error, 'phosphateValue'))
          }
        }
      }

      if (Object.keys(nextErrors).length > 0) {
        setFormErrors(nextErrors)
      }

      if (savedCount > 0) {
        setFormValues(defaultFormValues())
        await loadMeasurements(selectedAquariumId)
      }

      if (failureMessages.length > 0) {
        setSubmitError(failureMessages.join(' | '))
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMeasurement(measurementId: string, parameter: MeasurementParameter) {
    if (!selectedAquariumId) return

    setDeletingMeasurementId(measurementId)
    setDeleteError('')
    setLastDeleteAttempt({ id: measurementId, parameter })

    try {
      await deleteMeasurement(selectedAquariumId, parameter, measurementId)
      await loadMeasurements(selectedAquariumId)
    } catch (error) {
      setDeleteError(toUserMessage(error))
    } finally {
      setDeletingMeasurementId(null)
    }
  }

  async function loadAquariums(signal?: AbortSignal) {
    setAquariumsLoading(true)
    setAquariumsError('')

    try {
      const records = await listAquariums(signal)
      setAquariums(records)
      setSelectedAquariumId((current) => current ?? records[0]?.id ?? null)
    } catch (error) {
      setAquariumsError(toUserMessage(error))
    } finally {
      setAquariumsLoading(false)
    }
  }

  async function loadMeasurements(aquariumId: string, signal?: AbortSignal) {
    setViewState('loading')
    setHistoryError('')

    try {
      const [salinityRecords, phosphateRecords] = await Promise.all([
        listSalinityMeasurements(aquariumId, signal),
        listPhosphateMeasurements(aquariumId, signal),
      ])

      setMeasurements([...salinityRecords, ...phosphateRecords])
      setViewState('ready')
    } catch (error) {
      setHistoryError(toUserMessage(error))
      setViewState('error')
    }
  }

  return (
    <Stack gap="lg" pb="md">
      <Stack gap={2}>
        <Title order={2}>Aquarium Measurements</Title>
        <Text c="dimmed" size="sm">
          Record salinity (ppt) and phosphate (ppm) values, review historical trends, and remove incorrect entries.
        </Text>
      </Stack>

      {aquariumsLoading && <MeasurementsLoadingState />}

      {!aquariumsLoading && aquariumsError && (
        <Alert color="red" title="Could not load aquariums">
          <Stack gap="sm">
            <Text size="sm">{aquariumsError}</Text>
            <Group>
              <Button variant="outline" size="xs" onClick={handleRetryAquariums}>
                Retry
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {!aquariumsLoading && !aquariumsError && aquariums.length === 0 && (
        <Box
          py="xl"
          px="md"
          ta="center"
          style={{
            border: '1px dashed var(--mantine-color-gray-4)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <Text fw={600} mb="xs">No aquariums available</Text>
          <Text c="dimmed" size="sm">
            Add an aquarium in the Aquariums section before recording measurements.
          </Text>
        </Box>
      )}

      {!aquariumsLoading && !aquariumsError && aquariums.length > 0 && (
        <>
          <Card withBorder>
            <Card.Section p="md">
              <Stack gap="md">
                <Select
                  label="Aquarium"
                  data={aquariumOptions}
                  value={selectedAquariumId}
                  onChange={setSelectedAquariumId}
                  allowDeselect={false}
                />

                <Grid gap="md" align="end">
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <NumberInput
                      label="Salinity (ppt)"
                      value={formValues.salinityValue}
                      onChange={(value) => setFormValues((current) => ({ ...current, salinityValue: value === '' ? '' : Number(value) }))}
                      error={formErrors.salinityValue}
                      decimalScale={2}
                      allowNegative={false}
                      min={0.01}
                      clampBehavior="none"
                      placeholder="e.g. 35"
                      disabled={saving}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <NumberInput
                      label="Phosphate (ppm)"
                      value={formValues.phosphateValue}
                      onChange={(value) => setFormValues((current) => ({ ...current, phosphateValue: value === '' ? '' : Number(value) }))}
                      error={formErrors.phosphateValue}
                      decimalScale={3}
                      allowNegative={false}
                      min={0.001}
                      clampBehavior="none"
                      placeholder="e.g. 0.075"
                      disabled={saving}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput
                      type="datetime-local"
                      label="Measured At"
                      value={formValues.measuredAtLocal}
                      onChange={(event) => {
                        const measuredAtLocal = event.currentTarget.value
                        setFormValues((current) => ({ ...current, measuredAtLocal }))
                      }}
                      error={formErrors.measuredAtLocal}
                      disabled={saving}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 2 }}>
                    <Button fullWidth onClick={handleFormSubmit} loading={saving}>
                      Add
                    </Button>
                  </Grid.Col>
                </Grid>

                {submitError && (
                  <Alert color="red" title="Could not save one or more measurements">
                    <Stack gap="sm">
                      <Text size="sm">{submitError}</Text>
                      <Group>
                        <Button variant="outline" size="xs" onClick={handleRetryCreate} disabled={!lastSubmit || saving}>
                          Retry Submit
                        </Button>
                      </Group>
                    </Stack>
                  </Alert>
                )}

                {deleteError && (
                  <Alert color="red" title="Could not delete measurement">
                    <Stack gap="sm">
                      <Text size="sm">{deleteError}</Text>
                      <Group>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={handleRetryDelete}
                          disabled={!lastDeleteAttempt || deletingMeasurementId !== null}
                        >
                          Retry Delete
                        </Button>
                      </Group>
                    </Stack>
                  </Alert>
                )}
              </Stack>
            </Card.Section>
          </Card>

          {viewState === 'loading' && <MeasurementsLoadingState />}

          {viewState === 'error' && (
            <Alert color="red" title="Could not load measurement history">
              <Stack gap="sm">
                <Text size="sm">{historyError}</Text>
                <Group>
                  <Button variant="outline" size="xs" onClick={handleRetryHistory}>
                    Retry
                  </Button>
                </Group>
              </Stack>
            </Alert>
          )}

          {viewState === 'ready' && sortedMeasurements.length === 0 && (
            <Box
              py="xl"
              px="md"
              ta="center"
              style={{
                border: '1px dashed var(--mantine-color-gray-4)',
                borderRadius: 'var(--mantine-radius-md)',
              }}
            >
              <Text fw={600} mb="xs">No measurement history yet</Text>
              <Text c="dimmed" size="sm">Add your first measurements above to begin trend tracking.</Text>
            </Box>
          )}

          {viewState === 'ready' && sortedMeasurements.length > 0 && (
            <Stack gap="md">
              <SalinityTrendChart measurements={salinityMeasurements} />
              <MeasurementHistoryTable
                title="Salinity History"
                unit="ppt"
                measurements={salinityMeasurements}
                deletingMeasurementId={deletingMeasurementId}
                onDelete={handleDeleteMeasurement}
                testId="salinity-history-table"
              />
              <PhosphateTrendChart measurements={phosphateMeasurements} />
              <MeasurementHistoryTable
                title="Phosphate History"
                unit="ppm"
                measurements={phosphateMeasurements}
                deletingMeasurementId={deletingMeasurementId}
                onDelete={handleDeleteMeasurement}
                testId="phosphate-history-table"
              />
            </Stack>
          )}
        </>
      )}
    </Stack>
  )
}

function MeasurementsLoadingState() {
  return (
    <Stack gap="sm">
      <Skeleton h={42} />
      <Skeleton h={180} />
      <Skeleton h={220} />
    </Stack>
  )
}

interface MeasurementHistoryTableProps {
  title: string
  unit: 'ppt' | 'ppm'
  measurements: MeasurementRecord[]
  deletingMeasurementId: string | null
  onDelete: (measurementId: string, parameter: MeasurementParameter) => void
  testId: string
}

function MeasurementHistoryTable({
  title,
  unit,
  measurements,
  deletingMeasurementId,
  onDelete,
  testId,
}: MeasurementHistoryTableProps) {
  if (measurements.length === 0) {
    return (
      <Alert color="gray" title={`${title} unavailable`}>
        <Text size="sm">No {unit === 'ppt' ? 'salinity' : 'phosphate'} entries are available yet for this aquarium.</Text>
      </Alert>
    )
  }

  return (
    <Card withBorder>
      <Card.Section p="md" data-testid={testId}>
        <Stack gap="xs">
          <Text fw={600}>{title}</Text>
          <Table withTableBorder highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Measured At</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th ta="right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {measurements.map((measurement) => (
                <Table.Tr key={measurement.id}>
                  <Table.Td>{formatDate(measurement.measuredAt)}</Table.Td>
                  <Table.Td>{measurement.value.toFixed(unit === 'ppt' ? 2 : 3)} {unit}</Table.Td>
                  <Table.Td ta="right">
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      loading={deletingMeasurementId === measurement.id}
                      onClick={() => onDelete(measurement.id, measurement.parameter)}
                    >
                      Delete
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card.Section>
    </Card>
  )
}

function SalinityTrendChart({ measurements }: { measurements: MeasurementRecord[] }) {
  if (measurements.length < 2) {
    return (
      <Alert color="gray" title="Salinity trend unavailable">
        <Text size="sm">At least two salinity measurements are needed to render a trend line.</Text>
      </Alert>
    )
  }

  const ordered = [...measurements].sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt))
  const chartData = ordered.map((item) => ({
    measuredAt: formatShortDate(item.measuredAt),
    salinity: item.value,
  }))
  const optimalSalinity = 35
  const lowerThreshold = 33
  const upperThreshold = 37
  const values = chartData.map((item) => item.salinity)
  const yDomainMin = Math.min(lowerThreshold, ...values)
  const yDomainMax = Math.max(upperThreshold, ...values)
  const yRange = yDomainMax - yDomainMin

  const offsetForValue = (value: number): number => {
    if (yRange <= 0) return 50
    return ((yDomainMax - value) / yRange) * 100
  }

  const thresholdGradientStops = [
    { offset: 0, color: 'red.7' },
    { offset: offsetForValue(upperThreshold), color: 'red.7' },
    { offset: offsetForValue(optimalSalinity), color: 'green.6' },
    { offset: offsetForValue(lowerThreshold), color: 'red.7' },
    { offset: 100, color: 'red.7' },
  ].sort((a, b) => a.offset - b.offset)

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

  return (
    <Card withBorder>
      <Card.Section p="md">
        <Stack gap="xs">
          <Text fw={600}>Salinity Trend (ppt)</Text>
          <Text c="dimmed" size="sm">Displaying all recorded salinity measurements for the selected aquarium.</Text>
          <Box ref={chartContainerRef} mih={240}>
            {canRenderChart ? (
              <LineChart
                h={240}
                data={chartData}
                dataKey="measuredAt"
                type="gradient"
                gradientStops={thresholdGradientStops}
                yAxisProps={{ domain: [yDomainMin, yDomainMax] }}
                referenceLines={[{ y: optimalSalinity, label: 'Optimal Salinity (35 ppt)', color: 'green.7' }]}
                series={[{ name: 'salinity', label: 'Salinity' }]}
                curveType="monotone"
                withDots
                withLegend
                unit=" ppt"
                valueFormatter={(value) => value.toFixed(2)}
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

function PhosphateTrendChart({ measurements }: { measurements: MeasurementRecord[] }) {
  if (measurements.length < 2) {
    return (
      <Alert color="gray" title="Phosphate trend unavailable">
        <Text size="sm">At least two phosphate measurements are needed to render a trend line.</Text>
      </Alert>
    )
  }

  const ordered = [...measurements].sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt))
  const chartData = ordered.map((item) => ({
    measuredAt: formatShortDate(item.measuredAt),
    phosphate: item.value,
  }))
  const optimalPhosphate = 0.075
  const upperGreen = 0.1
  const redThreshold = 0.2
  const values = chartData.map((item) => item.phosphate)
  const yDomainMin = Math.min(0, ...values)
  const yDomainMax = Math.max(redThreshold, ...values)
  const yRange = yDomainMax - yDomainMin

  const offsetForValue = (value: number): number => {
    if (yRange <= 0) return 50
    return ((yDomainMax - value) / yRange) * 100
  }

  const thresholdGradientStops = [
    { offset: 0, color: 'red.7' },
    { offset: offsetForValue(redThreshold), color: 'red.7' },
    { offset: offsetForValue(upperGreen), color: 'green.6' },
    { offset: offsetForValue(0), color: 'green.6' },
    { offset: 100, color: 'green.6' },
  ].sort((a, b) => a.offset - b.offset)

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

  return (
    <Card withBorder>
      <Card.Section p="md">
        <Stack gap="xs">
          <Text fw={600}>Phosphate Trend (ppm)</Text>
          <Text c="dimmed" size="sm">Displaying all recorded phosphate measurements for the selected aquarium.</Text>
          <Box ref={chartContainerRef} mih={240}>
            {canRenderChart ? (
              <LineChart
                h={240}
                data={chartData}
                dataKey="measuredAt"
                type="gradient"
                gradientStops={thresholdGradientStops}
                yAxisProps={{ domain: [yDomainMin, yDomainMax] }}
                referenceLines={[{ y: optimalPhosphate, label: 'Optimal Phosphate (0.075 ppm)', color: 'green.7' }]}
                series={[{ name: 'phosphate', label: 'Phosphate' }]}
                curveType="monotone"
                withDots
                withLegend
                unit=" ppm"
                valueFormatter={(value) => value.toFixed(3)}
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

function validateMeasurement(values: MeasurementFormValues) {
  const errors: Partial<Record<keyof MeasurementFormValues, string>> = {}

  const hasSalinity = values.salinityValue !== ''
  const hasPhosphate = values.phosphateValue !== ''

  if (!hasSalinity && !hasPhosphate) {
    errors.salinityValue = 'Enter at least one measurement value to submit.'
    errors.phosphateValue = 'Enter at least one measurement value to submit.'
  }

  if (hasSalinity && (Number.isNaN(Number(values.salinityValue)) || Number(values.salinityValue) <= 0)) {
    errors.salinityValue = 'Enter a salinity value greater than 0 ppt.'
  }

  if (hasPhosphate && (Number.isNaN(Number(values.phosphateValue)) || Number(values.phosphateValue) <= 0)) {
    errors.phosphateValue = 'Enter a phosphate value greater than 0 ppm.'
  }

  if (!values.measuredAtLocal) {
    errors.measuredAtLocal = 'Choose when the measurement was taken.'
  }

  return errors
}

function mapApiValidationErrors(
  error: ApiRequestError,
  valueKey: 'salinityValue' | 'phosphateValue',
): Partial<Record<keyof MeasurementFormValues, string>> {
  const errors: Partial<Record<keyof MeasurementFormValues, string>> = {}

  for (const item of error.validationErrors ?? []) {
    if (item.loc.includes('value')) {
      errors[valueKey] = item.msg
    }

    if (item.loc.includes('measured_at')) {
      errors.measuredAtLocal = item.msg
    }
  }

  return errors
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
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

function toIsoString(localDateTime: string): string {
  const date = new Date(localDateTime)
  if (Number.isNaN(date.getTime())) {
    return localDateTime
  }

  return date.toISOString()
}
