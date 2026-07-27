import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  Alert,
  Button,
  Card,
  Group,
  NumberInput,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { type AquariumRecord, getAquarium, updateAquarium } from '../api/aquariums'
import {
  THRESHOLD_SANITY_RANGES,
  THRESHOLD_UNITS,
  getThreshold,
  setThreshold,
  type ThresholdParameter,
} from '../api/thresholds'
import { ApiRequestError, toUserMessage } from '../api/client'

interface AquariumFormValues {
  name: string
  type: string
  volumeValue: number | ''
  volumeUnit: 'L' | 'gal_us'
}

type ViewState = 'loading' | 'ready' | 'error' | 'not-found'

const AQUARIUM_TYPES = [
  'Saltwater Reef',
  'Saltwater FOWLR',
  'Freshwater Planted',
  'Freshwater Community',
]

const THRESHOLD_PARAMETERS: ThresholdParameter[] = [
  'temperature',
  'salinity',
  'phosphate',
  'calcium',
  'magnesium',
  'alkalinity',
  'ph',
  'ammonia',
  'nitrite',
  'nitrate',
]

const PARAMETER_LABELS: Record<ThresholdParameter, string> = {
  temperature: 'Temperature',
  salinity: 'Salinity',
  phosphate: 'Phosphate',
  calcium: 'Calcium',
  magnesium: 'Magnesium',
  alkalinity: 'Alkalinity',
  ph: 'pH',
  ammonia: 'Ammonia',
  nitrite: 'Nitrite',
  nitrate: 'Nitrate',
}

interface ThresholdFieldValues {
  min: number | ''
  target: number | ''
  max: number | ''
}

interface ThresholdRowState {
  values: ThresholdFieldValues
  loading: boolean
  saving: boolean
  error: string
  fieldErrors: Partial<Record<keyof ThresholdFieldValues, string>>
}

function emptyThresholdValues(): ThresholdFieldValues {
  return { min: '', target: '', max: '' }
}

function defaultThresholdRowState(): ThresholdRowState {
  return {
    values: emptyThresholdValues(),
    loading: true,
    saving: false,
    error: '',
    fieldErrors: {},
  }
}

function defaultThresholdRows(): Record<ThresholdParameter, ThresholdRowState> {
  return {
    temperature: defaultThresholdRowState(),
    salinity: defaultThresholdRowState(),
    phosphate: defaultThresholdRowState(),
    calcium: defaultThresholdRowState(),
    magnesium: defaultThresholdRowState(),
    alkalinity: defaultThresholdRowState(),
    ph: defaultThresholdRowState(),
    ammonia: defaultThresholdRowState(),
    nitrite: defaultThresholdRowState(),
    nitrate: defaultThresholdRowState(),
  }
}

export function AquariumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [viewState, setViewState] = useState<ViewState>('loading')
  const [pageError, setPageError] = useState('')
  const [aquarium, setAquarium] = useState<AquariumRecord | null>(null)

  const [formValues, setFormValues] = useState<AquariumFormValues>({
    name: '',
    type: AQUARIUM_TYPES[0],
    volumeValue: '',
    volumeUnit: 'L',
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AquariumFormValues, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  const [thresholdRows, setThresholdRows] = useState<Record<ThresholdParameter, ThresholdRowState>>(
    defaultThresholdRows(),
  )

  useEffect(() => {
    if (!id) {
      setViewState('not-found')
      return
    }

    const controller = new AbortController()
    void loadAquarium(id, controller.signal)
    void loadThresholds(id, controller.signal)

    return () => {
      controller.abort()
    }
  }, [id])

  async function loadAquarium(aquariumId: string, signal?: AbortSignal) {
    setViewState('loading')
    setPageError('')

    try {
      const record = await getAquarium(aquariumId, signal)
      setAquarium(record)
      setFormValues({
        name: record.name,
        type: record.type,
        volumeValue: Number(record.volumeLiters.toFixed(2)),
        volumeUnit: 'L',
      })
      setViewState('ready')
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        setViewState('not-found')
        return
      }
      setPageError(toUserMessage(error))
      setViewState('error')
    }
  }

  async function loadThresholds(aquariumId: string, signal?: AbortSignal) {
    await Promise.all(
      THRESHOLD_PARAMETERS.map(async (parameter) => {
        try {
          const record = await getThreshold(aquariumId, parameter, signal)
          setThresholdRows((current) => ({
            ...current,
            [parameter]: {
              ...current[parameter],
              values: {
                min: record.min ?? '',
                target: record.target ?? '',
                max: record.max ?? '',
              },
              loading: false,
            },
          }))
        } catch (error) {
          setThresholdRows((current) => ({
            ...current,
            [parameter]: {
              ...current[parameter],
              loading: false,
              error: toUserMessage(error),
            },
          }))
        }
      }),
    )
  }

  const handleRetry = () => {
    if (!id) return
    void loadAquarium(id)
    void loadThresholds(id)
  }

  const handleSubmit = async () => {
    if (!id) return

    const clientValidation = validateForm(formValues)
    if (Object.keys(clientValidation).length > 0) {
      setFormErrors(clientValidation)
      return
    }

    setSaving(true)
    setSubmitError('')
    setFormErrors({})

    try {
      const payload = {
        name: formValues.name.trim(),
        type: formValues.type,
        volume: {
          value: Number(formValues.volumeValue),
          unit: formValues.volumeUnit,
        },
      }

      const updated = await updateAquarium(id, payload)
      setAquarium(updated)
      setFormValues({
        name: updated.name,
        type: updated.type,
        volumeValue: Number(updated.volumeLiters.toFixed(2)),
        volumeUnit: 'L',
      })
    } catch (error) {
      setSubmitError(toUserMessage(error))
      if (error instanceof ApiRequestError && error.validationErrors?.length) {
        setFormErrors(mapAquariumValidationErrors(error))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleThresholdFieldChange = (
    parameter: ThresholdParameter,
    field: keyof ThresholdFieldValues,
    value: number | '',
  ) => {
    setThresholdRows((current) => ({
      ...current,
      [parameter]: {
        ...current[parameter],
        values: { ...current[parameter].values, [field]: value },
      },
    }))
  }

  const handleSaveThresholdRow = async (parameter: ThresholdParameter) => {
    if (!id) return

    const row = thresholdRows[parameter]
    const fieldErrors = validateThresholdRow(parameter, row.values)
    if (Object.keys(fieldErrors).length > 0) {
      setThresholdRows((current) => ({
        ...current,
        [parameter]: { ...current[parameter], fieldErrors, error: '' },
      }))
      return
    }

    setThresholdRows((current) => ({
      ...current,
      [parameter]: { ...current[parameter], saving: true, error: '', fieldErrors: {} },
    }))

    try {
      const record = await setThreshold(id, parameter, {
        min: row.values.min === '' ? null : Number(row.values.min),
        target: row.values.target === '' ? null : Number(row.values.target),
        max: row.values.max === '' ? null : Number(row.values.max),
      })
      setThresholdRows((current) => ({
        ...current,
        [parameter]: {
          ...current[parameter],
          values: {
            min: record.min ?? '',
            target: record.target ?? '',
            max: record.max ?? '',
          },
          saving: false,
        },
      }))
    } catch (error) {
      const nextFieldErrors =
        error instanceof ApiRequestError && error.validationErrors?.length
          ? mapThresholdValidationErrors(error)
          : {}
      setThresholdRows((current) => ({
        ...current,
        [parameter]: {
          ...current[parameter],
          saving: false,
          error: toUserMessage(error),
          fieldErrors: nextFieldErrors,
        },
      }))
    }
  }

  const pageTitle = useMemo(() => (aquarium ? aquarium.name : 'Edit Aquarium'), [aquarium])

  if (viewState === 'not-found') {
    return (
      <Stack gap="md" pb="md">
        <Alert color="yellow" variant="light" title="Aquarium not found">
          <Stack gap="sm">
            <Text size="sm">This aquarium could not be found. It may have been deleted.</Text>
            <Button component={Link} to="/aquariums" variant="outline" size="xs">
              Back to Aquariums
            </Button>
          </Stack>
        </Alert>
      </Stack>
    )
  }

  return (
    <Stack gap="md" pb="md">
      <Group justify="space-between" align="center">
        <Title order={2}>{pageTitle}</Title>
        <Button variant="subtle" onClick={() => navigate('/aquariums')}>
          Back to Aquariums
        </Button>
      </Group>

      {viewState === 'loading' && (
        <Stack gap="sm">
          <Skeleton h={44} radius="md" />
          <Skeleton h={44} radius="md" />
          <Skeleton h={44} radius="md" />
        </Stack>
      )}

      {viewState === 'error' && (
        <Alert color="red" variant="light" title="Could not load aquarium">
          <Stack gap="sm">
            <Text size="sm">{pageError}</Text>
            <Group>
              <Button size="xs" variant="outline" onClick={handleRetry}>
                Retry
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {viewState === 'ready' && (
        <>
          <Card withBorder padding="lg">
            <Stack gap="md">
              <TextInput
                label="Aquarium Name"
                placeholder="e.g., Living Room Reef"
                value={formValues.name}
                onChange={(event) => {
                  const nextName = event.currentTarget.value
                  setFormValues((current) => ({ ...current, name: nextName }))
                }}
                error={formErrors.name}
                description="Give your aquarium a memorable name"
              />

              <Select
                label="Type"
                placeholder="Select type..."
                value={formValues.type || null}
                onChange={(value) => setFormValues((current) => ({ ...current, type: value ?? '' }))}
                data={AQUARIUM_TYPES}
                error={formErrors.type}
              />

              <Group align="end" grow>
                <NumberInput
                  label="Volume"
                  placeholder="75"
                  value={formValues.volumeValue}
                  onChange={(value) => {
                    const parsed = typeof value === 'number' ? value : value === '' ? '' : Number(value)
                    setFormValues((current) => ({
                      ...current,
                      volumeValue: Number.isNaN(parsed) ? '' : parsed,
                    }))
                  }}
                  allowNegative={false}
                  clampBehavior="none"
                  error={formErrors.volumeValue}
                />

                <Select
                  label="Unit"
                  value={formValues.volumeUnit}
                  onChange={(value) =>
                    setFormValues((current) => ({
                      ...current,
                      volumeUnit: (value as AquariumFormValues['volumeUnit'] | null) ?? 'L',
                    }))
                  }
                  error={formErrors.volumeUnit}
                  data={[
                    { label: 'L', value: 'L' },
                    { label: 'gal (US)', value: 'gal_us' },
                  ]}
                />
              </Group>

              {submitError ? <Text c="red" size="sm">{submitError}</Text> : null}

              <Group justify="end">
                <Button onClick={() => void handleSubmit()} loading={saving}>
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </Card>

          <Title order={3}>Parameter Limits</Title>

          <Stack gap="md">
            {THRESHOLD_PARAMETERS.map((parameter) => {
              const row = thresholdRows[parameter]
              return (
                <Card key={parameter} withBorder padding="lg">
                  <Stack gap="sm">
                    <Text fw={500}>
                      {PARAMETER_LABELS[parameter]} ({THRESHOLD_UNITS[parameter]})
                    </Text>

                    {row.loading ? (
                      <Skeleton h={36} radius="md" />
                    ) : (
                      <>
                        <Group grow align="end">
                          <NumberInput
                            label="Min"
                            value={row.values.min}
                            onChange={(value) =>
                              handleThresholdFieldChange(parameter, 'min', toNumberOrEmpty(value))
                            }
                            error={row.fieldErrors.min}
                            clampBehavior="none"
                          />
                          <NumberInput
                            label="Target"
                            value={row.values.target}
                            onChange={(value) =>
                              handleThresholdFieldChange(parameter, 'target', toNumberOrEmpty(value))
                            }
                            error={row.fieldErrors.target}
                            clampBehavior="none"
                          />
                          <NumberInput
                            label="Max"
                            value={row.values.max}
                            onChange={(value) =>
                              handleThresholdFieldChange(parameter, 'max', toNumberOrEmpty(value))
                            }
                            error={row.fieldErrors.max}
                            clampBehavior="none"
                          />
                        </Group>

                        {row.error ? <Text c="red" size="sm">{row.error}</Text> : null}

                        <Group justify="end">
                          <Button
                            size="xs"
                            variant="outline"
                            loading={row.saving}
                            onClick={() => void handleSaveThresholdRow(parameter)}
                          >
                            Save {PARAMETER_LABELS[parameter]} Limits
                          </Button>
                        </Group>
                      </>
                    )}
                  </Stack>
                </Card>
              )
            })}
          </Stack>
        </>
      )}
    </Stack>
  )
}

function toNumberOrEmpty(value: number | string): number | '' {
  if (typeof value === 'number') return value
  if (value === '') return ''
  const parsed = Number(value)
  return Number.isNaN(parsed) ? '' : parsed
}

function validateForm(values: AquariumFormValues): Partial<Record<keyof AquariumFormValues, string>> {
  const errors: Partial<Record<keyof AquariumFormValues, string>> = {}

  if (values.name.trim().length === 0) {
    errors.name = 'Name is required'
  }

  if (values.type.trim().length === 0) {
    errors.type = 'Type is required'
  }

  const volumeValue = Number(values.volumeValue)
  if (values.volumeValue === '' || Number.isNaN(volumeValue) || volumeValue <= 0) {
    errors.volumeValue = 'Volume must be greater than 0'
  }

  if (values.volumeUnit !== 'L' && values.volumeUnit !== 'gal_us') {
    errors.volumeUnit = 'Select a valid unit'
  }

  return errors
}

function mapAquariumValidationErrors(
  error: ApiRequestError,
): Partial<Record<keyof AquariumFormValues, string>> {
  const errors: Partial<Record<keyof AquariumFormValues, string>> = {}

  for (const item of error.validationErrors ?? []) {
    const fieldKey = item.loc.join('.')
    if (fieldKey.endsWith('name')) {
      errors.name = item.msg
    }
    if (fieldKey.endsWith('type')) {
      errors.type = item.msg
    }
    if (fieldKey.endsWith('volume.value')) {
      errors.volumeValue = item.msg
    }
    if (fieldKey.endsWith('volume.unit')) {
      errors.volumeUnit = item.msg
    }
  }

  return errors
}

function validateThresholdRow(
  parameter: ThresholdParameter,
  values: ThresholdFieldValues,
): Partial<Record<keyof ThresholdFieldValues, string>> {
  const errors: Partial<Record<keyof ThresholdFieldValues, string>> = {}
  const { min: rangeMin, max: rangeMax } = THRESHOLD_SANITY_RANGES[parameter]

  const min = values.min === '' ? null : Number(values.min)
  const target = values.target === '' ? null : Number(values.target)
  const max = values.max === '' ? null : Number(values.max)

  for (const [key, value] of [
    ['min', min],
    ['target', target],
    ['max', max],
  ] as const) {
    if (value !== null && (Number.isNaN(value) || value < rangeMin || value > rangeMax)) {
      errors[key] = `Must be between ${rangeMin} and ${rangeMax}`
    }
  }

  if (Object.keys(errors).length > 0) {
    return errors
  }

  if (min !== null && target !== null && min > target) {
    errors.min = 'Min must be less than or equal to target'
  }
  if (target !== null && max !== null && target > max) {
    errors.max = 'Target must be less than or equal to max'
  }
  if (min !== null && max !== null && min > max) {
    errors.min = 'Min must be less than or equal to max'
  }

  return errors
}

function mapThresholdValidationErrors(
  error: ApiRequestError,
): Partial<Record<keyof ThresholdFieldValues, string>> {
  const errors: Partial<Record<keyof ThresholdFieldValues, string>> = {}

  for (const item of error.validationErrors ?? []) {
    if (item.loc.includes('min')) {
      errors.min = item.msg
    }
    if (item.loc.includes('target')) {
      errors.target = item.msg
    }
    if (item.loc.includes('max')) {
      errors.max = item.msg
    }
  }

  return errors
}
