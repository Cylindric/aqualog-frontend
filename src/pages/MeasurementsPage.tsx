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
  createAlkalinityMeasurement,
  createAmmoniaMeasurement,
  createCalciumMeasurement,
  createMagnesiumMeasurement,
  createNitrateMeasurement,
  createNitriteMeasurement,
  createPhMeasurement,
  createPhosphateMeasurement,
  createSalinityMeasurement,
  deleteMeasurement,
  listAlkalinityMeasurements,
  listAmmoniaMeasurements,
  listCalciumMeasurements,
  listMagnesiumMeasurements,
  listNitrateMeasurements,
  listNitriteMeasurements,
  listPhMeasurements,
  listPhosphateMeasurements,
  listSalinityMeasurements,
  type CreateMeasurementInput,
  type MeasurementParameter,
  type MeasurementRecord,
} from '../api/measurements'
import { getThreshold, type ThresholdRecord } from '../api/thresholds'
import { ApiRequestError, toUserMessage } from '../api/client'

type MeasurementsViewState = 'idle' | 'loading' | 'ready' | 'error'

interface ParameterConfig {
  key: MeasurementParameter
  label: string
  unit: string
  decimalScale: number
  placeholder: string
  list: (aquariumId: string, signal?: AbortSignal) => Promise<MeasurementRecord[]>
  create: (aquariumId: string, input: CreateMeasurementInput, signal?: AbortSignal) => Promise<MeasurementRecord>
}

const PARAMETERS: ParameterConfig[] = [
  {
    key: 'salinity',
    label: 'Salinity',
    unit: 'ppt',
    decimalScale: 2,
    placeholder: 'e.g. 35',
    list: listSalinityMeasurements,
    create: createSalinityMeasurement,
  },
  {
    key: 'phosphate',
    label: 'Phosphate',
    unit: 'ppm',
    decimalScale: 3,
    placeholder: 'e.g. 0.075',
    list: listPhosphateMeasurements,
    create: createPhosphateMeasurement,
  },
  {
    key: 'calcium',
    label: 'Calcium',
    unit: 'ppm',
    decimalScale: 1,
    placeholder: 'e.g. 420',
    list: listCalciumMeasurements,
    create: createCalciumMeasurement,
  },
  {
    key: 'magnesium',
    label: 'Magnesium',
    unit: 'ppm',
    decimalScale: 1,
    placeholder: 'e.g. 1350',
    list: listMagnesiumMeasurements,
    create: createMagnesiumMeasurement,
  },
  {
    key: 'alkalinity',
    label: 'Alkalinity',
    unit: 'dKH',
    decimalScale: 2,
    placeholder: 'e.g. 8.5',
    list: listAlkalinityMeasurements,
    create: createAlkalinityMeasurement,
  },
  {
    key: 'ph',
    label: 'pH',
    unit: 'pH',
    decimalScale: 2,
    placeholder: 'e.g. 8.2',
    list: listPhMeasurements,
    create: createPhMeasurement,
  },
  {
    key: 'ammonia',
    label: 'Ammonia',
    unit: 'mg/L',
    decimalScale: 2,
    placeholder: 'e.g. 0.25',
    list: listAmmoniaMeasurements,
    create: createAmmoniaMeasurement,
  },
  {
    key: 'nitrite',
    label: 'Nitrite',
    unit: 'ppm',
    decimalScale: 2,
    placeholder: 'e.g. 0.5',
    list: listNitriteMeasurements,
    create: createNitriteMeasurement,
  },
  {
    key: 'nitrate',
    label: 'Nitrate',
    unit: 'ppm',
    decimalScale: 1,
    placeholder: 'e.g. 10',
    list: listNitrateMeasurements,
    create: createNitrateMeasurement,
  },
]

type ParameterValues = Record<MeasurementParameter, number | ''>

interface MeasurementFormValues {
  values: ParameterValues
  measuredAtLocal: string
}

interface LastDeleteAttempt {
  id: string
  parameter: MeasurementParameter
}

function emptyParameterValues(): ParameterValues {
  const values = {} as ParameterValues
  for (const parameter of PARAMETERS) {
    values[parameter.key] = ''
  }
  return values
}

function defaultFormValues(): MeasurementFormValues {
  return {
    values: emptyParameterValues(),
    measuredAtLocal: new Date().toISOString().slice(0, 16),
  }
}

function emptyThresholds(): Record<MeasurementParameter, ThresholdRecord | null> {
  const thresholds = {} as Record<MeasurementParameter, ThresholdRecord | null>
  for (const parameter of PARAMETERS) {
    thresholds[parameter.key] = null
  }
  return thresholds
}

export function MeasurementsPage() {
  const [aquariums, setAquariums] = useState<AquariumRecord[]>([])
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(null)
  const [aquariumsLoading, setAquariumsLoading] = useState(true)
  const [aquariumsError, setAquariumsError] = useState('')

  const [viewState, setViewState] = useState<MeasurementsViewState>('idle')
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([])
  const [historyError, setHistoryError] = useState('')

  const [thresholds, setThresholds] = useState<Record<MeasurementParameter, ThresholdRecord | null>>(
    emptyThresholds(),
  )

  const [formValues, setFormValues] = useState<MeasurementFormValues>(defaultFormValues())
  const [formErrors, setFormErrors] = useState<Partial<Record<MeasurementParameter | 'measuredAtLocal', string>>>({})
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
      setThresholds(emptyThresholds())
      return
    }

    const controller = new AbortController()
    void loadMeasurements(selectedAquariumId, controller.signal)
    void loadThresholds(selectedAquariumId, controller.signal)
    return () => {
      controller.abort()
    }
  }, [selectedAquariumId])

  const sortedMeasurements = useMemo(
    () => [...measurements].sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt)),
    [measurements],
  )

  const measurementsByParameter = useMemo(() => {
    const grouped = {} as Record<MeasurementParameter, MeasurementRecord[]>
    for (const parameter of PARAMETERS) {
      grouped[parameter.key] = sortedMeasurements.filter((measurement) => measurement.parameter === parameter.key)
    }
    return grouped
  }, [sortedMeasurements])

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

  const handleValueChange = (parameter: MeasurementParameter, value: number | '') => {
    setFormValues((current) => ({
      ...current,
      values: { ...current.values, [parameter]: value },
    }))
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

    const nextErrors: Partial<Record<MeasurementParameter | 'measuredAtLocal', string>> = {}
    const failureMessages: string[] = []
    let savedCount = 0

    try {
      for (const parameter of PARAMETERS) {
        const value = values.values[parameter.key]
        if (value === '') continue

        try {
          await parameter.create(selectedAquariumId, {
            value: Number(value),
            measuredAt: toIsoString(values.measuredAtLocal),
          })
          savedCount += 1
        } catch (error) {
          failureMessages.push(`${parameter.label}: ${toUserMessage(error)}`)
          if (error instanceof ApiRequestError && error.validationErrors?.length) {
            Object.assign(nextErrors, mapApiValidationErrors(error, parameter.key))
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
      const results = await Promise.all(
        PARAMETERS.map((parameter) => parameter.list(aquariumId, signal)),
      )

      setMeasurements(results.flat())
      setViewState('ready')
    } catch (error) {
      setHistoryError(toUserMessage(error))
      setViewState('error')
    }
  }

  async function loadThresholds(aquariumId: string, signal?: AbortSignal) {
    try {
      const results = await Promise.all(
        PARAMETERS.map((parameter) => getThreshold(aquariumId, parameter.key, signal)),
      )

      const next = {} as Record<MeasurementParameter, ThresholdRecord | null>
      PARAMETERS.forEach((parameter, index) => {
        next[parameter.key] = results[index]
      })
      setThresholds(next)
    } catch {
      // Configured limits are a chart enhancement, not core data - degrade to unannotated trend lines.
      setThresholds(emptyThresholds())
    }
  }

  return (
    <Stack gap="lg" pb="md">
      <Stack gap={2}>
        <Title order={2}>Aquarium Measurements</Title>
        <Text c="dimmed" size="sm">
          Record parameter readings, review historical trends, and remove incorrect entries.
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
                  {PARAMETERS.map((parameter) => (
                    <Grid.Col key={parameter.key} span={{ base: 12, xs: 6, sm: 4, md: 3 }}>
                      <NumberInput
                        label={`${parameter.label} (${parameter.unit})`}
                        value={formValues.values[parameter.key]}
                        onChange={(value) =>
                          handleValueChange(parameter.key, value === '' ? '' : Number(value))
                        }
                        error={formErrors[parameter.key]}
                        decimalScale={parameter.decimalScale}
                        allowNegative={false}
                        min={0.01}
                        clampBehavior="none"
                        placeholder={parameter.placeholder}
                        disabled={saving}
                      />
                    </Grid.Col>
                  ))}
                  <Grid.Col span={{ base: 12, sm: 8, md: 6 }}>
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
                  <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
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
              {PARAMETERS.map((parameter) => (
                <Stack gap="md" key={parameter.key}>
                  <ParameterTrendChart
                    parameter={parameter}
                    measurements={measurementsByParameter[parameter.key]}
                    threshold={thresholds[parameter.key]}
                  />
                  <MeasurementHistoryTable
                    parameter={parameter}
                    measurements={measurementsByParameter[parameter.key]}
                    deletingMeasurementId={deletingMeasurementId}
                    onDelete={handleDeleteMeasurement}
                  />
                </Stack>
              ))}
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
  parameter: ParameterConfig
  measurements: MeasurementRecord[]
  deletingMeasurementId: string | null
  onDelete: (measurementId: string, parameter: MeasurementParameter) => void
}

function MeasurementHistoryTable({
  parameter,
  measurements,
  deletingMeasurementId,
  onDelete,
}: MeasurementHistoryTableProps) {
  const title = `${parameter.label} History`

  if (measurements.length === 0) {
    return (
      <Alert color="gray" title={`${title} unavailable`}>
        <Text size="sm">No {parameter.label.toLowerCase()} entries are available yet for this aquarium.</Text>
      </Alert>
    )
  }

  return (
    <Card withBorder>
      <Card.Section p="md" data-testid={`${parameter.key}-history-table`}>
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
                  <Table.Td>
                    {measurement.value.toFixed(parameter.decimalScale)} {parameter.unit}
                  </Table.Td>
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

function ParameterTrendChart({
  parameter,
  measurements,
  threshold,
}: {
  parameter: ParameterConfig
  measurements: MeasurementRecord[]
  threshold: ThresholdRecord | null
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
    return (
      <Alert color="gray" title={`${parameter.label} trend unavailable`}>
        <Text size="sm">
          At least two {parameter.label.toLowerCase()} measurements are needed to render a trend line.
        </Text>
      </Alert>
    )
  }

  const ordered = [...measurements].sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt))
  const chartData = ordered.map((item) => ({
    measuredAt: formatShortDate(item.measuredAt),
    [parameter.key]: item.value,
  }))
  const values = chartData.map((item) => item[parameter.key] as number)
  const visuals = computeThresholdVisuals(threshold, values, parameter.label, (value) =>
    value.toFixed(parameter.decimalScale),
  )

  return (
    <Card withBorder>
      <Card.Section p="md">
        <Stack gap="xs">
          <Text fw={600}>{parameter.label} Trend ({parameter.unit})</Text>
          <Text c="dimmed" size="sm">
            Displaying all recorded {parameter.label.toLowerCase()} measurements for the selected aquarium.
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
                series={[{ name: parameter.key, label: parameter.label }]}
                curveType="monotone"
                withDots
                withLegend
                unit={` ${parameter.unit}`}
                valueFormatter={(value) => value.toFixed(parameter.decimalScale)}
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

interface ThresholdVisuals {
  gradientStops?: { offset: number; color: string }[]
  referenceLines?: { y: number; label: string; color: string }[]
  yDomainMin: number
  yDomainMax: number
}

function computeThresholdVisuals(
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

  const referenceLines =
    target !== null
      ? [{ y: target, label: `Target ${parameterLabel} (${formatValue(target)})`, color: 'green.7' }]
      : undefined

  if (min === null && max === null) {
    return { referenceLines, yDomainMin, yDomainMax }
  }

  const yRange = yDomainMax - yDomainMin
  const offsetForValue = (value: number): number => {
    if (yRange <= 0) return 50
    return Math.min(100, Math.max(0, ((yDomainMax - value) / yRange) * 100))
  }

  const greenAnchor = target ?? ((min ?? yDomainMin) + (max ?? yDomainMax)) / 2

  const gradientStops = [
    { offset: 0, color: max !== null ? 'red.7' : 'green.6' },
    ...(max !== null ? [{ offset: offsetForValue(max), color: 'red.7' }] : []),
    { offset: offsetForValue(greenAnchor), color: 'green.6' },
    ...(min !== null ? [{ offset: offsetForValue(min), color: 'red.7' }] : []),
    { offset: 100, color: min !== null ? 'red.7' : 'green.6' },
  ].sort((a, b) => a.offset - b.offset)

  return { gradientStops, referenceLines, yDomainMin, yDomainMax }
}

function validateMeasurement(
  values: MeasurementFormValues,
): Partial<Record<MeasurementParameter | 'measuredAtLocal', string>> {
  const errors: Partial<Record<MeasurementParameter | 'measuredAtLocal', string>> = {}

  const hasAnyValue = PARAMETERS.some((parameter) => values.values[parameter.key] !== '')

  if (!hasAnyValue) {
    const message = 'Enter at least one measurement value to submit.'
    for (const parameter of PARAMETERS) {
      errors[parameter.key] = message
    }
  }

  for (const parameter of PARAMETERS) {
    const value = values.values[parameter.key]
    if (value !== '' && (Number.isNaN(Number(value)) || Number(value) <= 0)) {
      errors[parameter.key] = `Enter a ${parameter.label.toLowerCase()} value greater than 0 ${parameter.unit}.`
    }
  }

  if (!values.measuredAtLocal) {
    errors.measuredAtLocal = 'Choose when the measurement was taken.'
  }

  return errors
}

function mapApiValidationErrors(
  error: ApiRequestError,
  parameterKey: MeasurementParameter,
): Partial<Record<MeasurementParameter | 'measuredAtLocal', string>> {
  const errors: Partial<Record<MeasurementParameter | 'measuredAtLocal', string>> = {}

  for (const item of error.validationErrors ?? []) {
    if (item.loc.includes('value')) {
      errors[parameterKey] = item.msg
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
