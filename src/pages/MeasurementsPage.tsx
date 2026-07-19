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
  createSalinityMeasurement,
  listSalinityMeasurements,
  type SalinityMeasurementRecord,
} from '../api/measurements'
import { ApiRequestError, toUserMessage } from '../api/client'

type MeasurementsViewState = 'idle' | 'loading' | 'ready' | 'error'

interface MeasurementFormValues {
  value: number | ''
  measuredAtLocal: string
}

function defaultFormValues(): MeasurementFormValues {
  return {
    value: '',
    measuredAtLocal: new Date().toISOString().slice(0, 16),
  }
}

export function MeasurementsPage() {
  const [aquariums, setAquariums] = useState<AquariumRecord[]>([])
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(null)
  const [aquariumsLoading, setAquariumsLoading] = useState(true)
  const [aquariumsError, setAquariumsError] = useState('')

  const [viewState, setViewState] = useState<MeasurementsViewState>('idle')
  const [measurements, setMeasurements] = useState<SalinityMeasurementRecord[]>([])
  const [historyError, setHistoryError] = useState('')

  const [formValues, setFormValues] = useState<MeasurementFormValues>(defaultFormValues())
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MeasurementFormValues, string>>>({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [lastSubmit, setLastSubmit] = useState<MeasurementFormValues | null>(null)

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

    try {
      await createSalinityMeasurement(selectedAquariumId, {
        value: Number(values.value),
        measuredAt: toIsoString(values.measuredAtLocal),
      })

      setFormValues(defaultFormValues())
      await loadMeasurements(selectedAquariumId)
    } catch (error) {
      setSubmitError(toUserMessage(error))
      if (error instanceof ApiRequestError && error.validationErrors?.length) {
        setFormErrors(mapApiValidationErrors(error))
      }
    } finally {
      setSaving(false)
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
      const records = await listSalinityMeasurements(aquariumId, signal)
      setMeasurements(records)
      setViewState('ready')
    } catch (error) {
      setHistoryError(toUserMessage(error))
      setViewState('error')
    }
  }

  return (
    <Stack gap="lg" pb="md">
      <Stack gap={2}>
        <Title order={2}>Salinity Measurements</Title>
        <Text c="dimmed" size="sm">
          Add salinity measurements in ppt and review historical trends for each aquarium.
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
            Add an aquarium in the Aquariums section before recording salinity measurements.
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
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <NumberInput
                      label="Salinity (ppt)"
                      description="Measurements in this iteration are stored in ppt"
                      value={formValues.value}
                      onChange={(value) => setFormValues((current) => ({ ...current, value: value === '' ? '' : Number(value) }))}
                      error={formErrors.value}
                      decimalScale={2}
                      allowNegative={false}
                      min={0.01}
                      clampBehavior="none"
                      placeholder="e.g. 35"
                      disabled={saving}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 5 }}>
                    <TextInput
                      type="datetime-local"
                      label="Measured At"
                      value={formValues.measuredAtLocal}
                      onChange={(event) => setFormValues((current) => ({ ...current, measuredAtLocal: event.currentTarget.value }))}
                      error={formErrors.measuredAtLocal}
                      disabled={saving}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <Button fullWidth onClick={handleFormSubmit} loading={saving}>
                      Add Measurement
                    </Button>
                  </Grid.Col>
                </Grid>

                {submitError && (
                  <Alert color="red" title="Could not save measurement">
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
              <Text fw={600} mb="xs">No salinity history yet</Text>
              <Text c="dimmed" size="sm">Add your first measurement above to begin trend tracking.</Text>
            </Box>
          )}

          {viewState === 'ready' && sortedMeasurements.length > 0 && (
            <Stack gap="md">
              <SalinityTrendChart measurements={sortedMeasurements} />
              <MeasurementHistoryTable measurements={sortedMeasurements} />
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

function MeasurementHistoryTable({ measurements }: { measurements: SalinityMeasurementRecord[] }) {
  return (
    <Table withTableBorder highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Measured At</Table.Th>
          <Table.Th>Salinity</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {measurements.map((measurement) => (
          <Table.Tr key={measurement.id}>
            <Table.Td>{formatDate(measurement.measuredAt)}</Table.Td>
            <Table.Td>{measurement.value.toFixed(2)} ppt</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

function SalinityTrendChart({ measurements }: { measurements: SalinityMeasurementRecord[] }) {
  if (measurements.length < 2) {
    return (
      <Alert color="gray" title="Trend visualization unavailable">
        <Text size="sm">At least two measurements are needed to render a salinity trend line.</Text>
      </Alert>
    )
  }

  const ordered = [...measurements].sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt))
  const chartData = ordered.map((item) => ({
    measuredAt: formatShortDate(item.measuredAt),
    salinity: item.value,
  }))
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
          <Text c="dimmed" size="sm">Displaying all recorded salinity history for the selected aquarium.</Text>
          <Box ref={chartContainerRef} mih={240}>
            {canRenderChart ? (
              <LineChart
                h={240}
                data={chartData}
                dataKey="measuredAt"
                series={[{ name: 'salinity', label: 'Salinity', color: 'blue.6' }]}
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

function validateMeasurement(values: MeasurementFormValues) {
  const errors: Partial<Record<keyof MeasurementFormValues, string>> = {}

  if (values.value === '' || Number.isNaN(Number(values.value)) || Number(values.value) <= 0) {
    errors.value = 'Enter a salinity value greater than 0 ppt.'
  }

  if (!values.measuredAtLocal) {
    errors.measuredAtLocal = 'Choose when the measurement was taken.'
  }

  return errors
}

function mapApiValidationErrors(error: ApiRequestError): Partial<Record<keyof MeasurementFormValues, string>> {
  const errors: Partial<Record<keyof MeasurementFormValues, string>> = {}

  for (const item of error.validationErrors ?? []) {
    if (item.loc.includes('value')) {
      errors.value = item.msg
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
