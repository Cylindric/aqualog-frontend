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
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { type AquariumRecord, getAquarium, updateAquarium } from '../api/aquariums'
import { listParameters, type ParameterRecord } from '../api/parameters'
import {
  THRESHOLD_SANITY_RANGES,
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

interface ThresholdParameterConfig {
  slug: ThresholdParameter
  displayName: string
  unit: string
}

function toThresholdParameterConfigs(parameters: ParameterRecord[]): ThresholdParameterConfig[] {
  return parameters
    .filter((parameter): parameter is ParameterRecord & { unit: string } => parameter.unit !== null)
    .map((parameter) => ({
      slug: parameter.slug as ThresholdParameter,
      displayName: parameter.displayName,
      unit: parameter.unit,
    }))
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

type ThresholdRowsState = Partial<Record<ThresholdParameter, ThresholdRowState>>

function seedThresholdRows(configs: ThresholdParameterConfig[]): ThresholdRowsState {
  const rows: ThresholdRowsState = {}
  for (const config of configs) {
    rows[config.slug] = defaultThresholdRowState()
  }
  return rows
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

  const [parameters, setParameters] = useState<ThresholdParameterConfig[]>([])
  const [parametersLoading, setParametersLoading] = useState(true)
  const [parametersError, setParametersError] = useState('')

  const [thresholdRows, setThresholdRows] = useState<ThresholdRowsState>({})

  useEffect(() => {
    if (!id) {
      setViewState('not-found')
      return
    }

    const controller = new AbortController()
    void loadAquarium(id, controller.signal)

    return () => {
      controller.abort()
    }
  }, [id])

  useEffect(() => {
    const controller = new AbortController()
    void loadParameters(controller.signal)

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!id || parameters.length === 0) return

    const controller = new AbortController()
    void loadThresholds(id, parameters, controller.signal)

    return () => {
      controller.abort()
    }
  }, [id, parameters])

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

  async function loadParameters(signal?: AbortSignal) {
    setParametersLoading(true)
    setParametersError('')

    try {
      const records = await listParameters(signal)
      const configs = toThresholdParameterConfigs(records)
      setParameters(configs)
      setThresholdRows(seedThresholdRows(configs))
    } catch (error) {
      setParametersError(toUserMessage(error))
    } finally {
      setParametersLoading(false)
    }
  }

  async function loadThresholds(aquariumId: string, configs: ThresholdParameterConfig[], signal?: AbortSignal) {
    await Promise.all(
      configs.map(async (config) => {
        try {
          const record = await getThreshold(aquariumId, config.slug, signal)
          setThresholdRows((current) => ({
            ...current,
            [config.slug]: {
              ...(current[config.slug] ?? defaultThresholdRowState()),
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
            [config.slug]: {
              ...(current[config.slug] ?? defaultThresholdRowState()),
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
    if (parameters.length > 0) {
      void loadThresholds(id, parameters)
    }
  }

  const handleRetryParameters = () => {
    void loadParameters()
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
    setThresholdRows((current) => {
      const row = current[parameter] ?? defaultThresholdRowState()
      return {
        ...current,
        [parameter]: { ...row, values: { ...row.values, [field]: value } },
      }
    })
  }

  const handleSaveThresholdRow = async (parameter: ThresholdParameter) => {
    if (!id) return

    const row = thresholdRows[parameter]
    if (!row) return

    const fieldErrors = validateThresholdRow(parameter, row.values)
    if (Object.keys(fieldErrors).length > 0) {
      setThresholdRows((current) => ({
        ...current,
        [parameter]: { ...(current[parameter] ?? row), fieldErrors, error: '' },
      }))
      return
    }

    setThresholdRows((current) => ({
      ...current,
      [parameter]: { ...(current[parameter] ?? row), saving: true, error: '', fieldErrors: {} },
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
          ...(current[parameter] ?? row),
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
          ...(current[parameter] ?? row),
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

          {parametersLoading && (
            <Stack gap={4}>
              <Skeleton h={32} radius="sm" />
              <Skeleton h={32} radius="sm" />
              <Skeleton h={32} radius="sm" />
              <Skeleton h={32} radius="sm" />
            </Stack>
          )}

          {!parametersLoading && parametersError && (
            <Alert color="red" variant="light" title="Could not load parameters">
              <Stack gap="sm">
                <Text size="sm">{parametersError}</Text>
                <Group>
                  <Button size="xs" variant="outline" onClick={handleRetryParameters}>
                    Retry
                  </Button>
                </Group>
              </Stack>
            </Alert>
          )}

          {!parametersLoading && !parametersError && (
            <Card withBorder>
              <Card.Section p="md">
                <Table.ScrollContainer minWidth={520}>
                  <Table verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Parameter</Table.Th>
                        <Table.Th>Min</Table.Th>
                        <Table.Th>Target</Table.Th>
                        <Table.Th>Max</Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {parameters.map((parameter) => {
                        const row = thresholdRows[parameter.slug] ?? defaultThresholdRowState()
                        return (
                          <Table.Tr key={parameter.slug}>
                            <Table.Td>
                              {parameter.displayName} ({parameter.unit})
                            </Table.Td>
                            {row.loading ? (
                              <>
                                <Table.Td colSpan={4}>
                                  <Skeleton h={28} radius="sm" />
                                </Table.Td>
                              </>
                            ) : (
                              <>
                                <Table.Td w={110}>
                                  <NumberInput
                                    aria-label="Min"
                                    value={row.values.min}
                                    onChange={(value) =>
                                      handleThresholdFieldChange(parameter.slug, 'min', toNumberOrEmpty(value))
                                    }
                                    error={row.fieldErrors.min}
                                    clampBehavior="none"
                                  />
                                </Table.Td>
                                <Table.Td w={110}>
                                  <NumberInput
                                    aria-label="Target"
                                    value={row.values.target}
                                    onChange={(value) =>
                                      handleThresholdFieldChange(parameter.slug, 'target', toNumberOrEmpty(value))
                                    }
                                    error={row.fieldErrors.target}
                                    clampBehavior="none"
                                  />
                                </Table.Td>
                                <Table.Td w={110}>
                                  <NumberInput
                                    aria-label="Max"
                                    value={row.values.max}
                                    onChange={(value) =>
                                      handleThresholdFieldChange(parameter.slug, 'max', toNumberOrEmpty(value))
                                    }
                                    error={row.fieldErrors.max}
                                    clampBehavior="none"
                                  />
                                </Table.Td>
                                <Table.Td w={100}>
                                  <Stack gap={4}>
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      loading={row.saving}
                                      aria-label={`Save ${parameter.displayName} limits`}
                                      onClick={() => void handleSaveThresholdRow(parameter.slug)}
                                    >
                                      Save
                                    </Button>
                                    {row.error ? <Text c="red" size="xs">{row.error}</Text> : null}
                                  </Stack>
                                </Table.Td>
                              </>
                            )}
                          </Table.Tr>
                        )
                      })}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Card.Section>
            </Card>
          )}
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
  // A parameter can appear in the catalog before the backend's fixed threshold
  // sanity-range table recognizes it, so skip the bound check (letting the
  // backend validate) rather than throwing on an unrecognized parameter.
  const range = THRESHOLD_SANITY_RANGES[parameter] as { min: number; max: number } | undefined

  const min = values.min === '' ? null : Number(values.min)
  const target = values.target === '' ? null : Number(values.target)
  const max = values.max === '' ? null : Number(values.max)

  if (range) {
    for (const [key, value] of [
      ['min', min],
      ['target', target],
      ['max', max],
    ] as const) {
      if (value !== null && (Number.isNaN(value) || value < range.min || value > range.max)) {
        errors[key] = `Must be between ${range.min} and ${range.max}`
      }
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
