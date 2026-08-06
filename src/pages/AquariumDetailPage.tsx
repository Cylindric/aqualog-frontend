import { useEffect, useState } from 'react'
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
import { ApiRequestError } from '../api/client'
import { type ThresholdParameter } from '../api/thresholds'
import { useAquariumDetail } from '../features/aquariums/useAquariumDetail'
import { useAquariumThresholds, defaultThresholdRowState } from '../features/aquariums/useAquariumThresholds'
import {
  AQUARIUM_TYPES,
  type AquariumFormValues,
  mapAquariumValidationErrors,
  toAquariumFormValues,
  validateAquariumForm,
} from '../features/aquariums/aquariumForm'
import { toNumberOrEmpty } from '../features/aquariums/numberField'

export function AquariumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { viewState, pageError, aquarium, retry, saving, submitError, update } = useAquariumDetail(id)
  const {
    parameters,
    parametersLoading,
    parametersError,
    retryParameters,
    thresholdRows,
    setFieldValue,
    saveRow,
  } = useAquariumThresholds(id)

  const [formValues, setFormValues] = useState<AquariumFormValues>({
    name: '',
    type: AQUARIUM_TYPES[0],
    volumeValue: '',
    volumeUnit: 'L',
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AquariumFormValues, string>>>({})

  // Keep the editable form in sync with the loaded (or just-saved) record.
  useEffect(() => {
    if (aquarium) {
      setFormValues(toAquariumFormValues(aquarium))
    }
  }, [aquarium])

  const handleSubmit = async () => {
    const clientValidation = validateAquariumForm(formValues)
    if (Object.keys(clientValidation).length > 0) {
      setFormErrors(clientValidation)
      return
    }

    setFormErrors({})

    try {
      await update(formValues)
    } catch (error) {
      if (error instanceof ApiRequestError && error.validationErrors?.length) {
        setFormErrors(mapAquariumValidationErrors(error))
      }
    }
  }

  const pageTitle = aquarium ? aquarium.name : 'Edit Aquarium'

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
              <Button size="xs" variant="outline" onClick={() => retry()}>
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
                  <Button size="xs" variant="outline" onClick={() => void retryParameters()}>
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
                        const slug = parameter.slug as ThresholdParameter
                        const row = thresholdRows[slug] ?? defaultThresholdRowState()
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
                                    onChange={(value) => setFieldValue(slug, 'min', toNumberOrEmpty(value))}
                                    error={row.fieldErrors.min}
                                    clampBehavior="none"
                                  />
                                </Table.Td>
                                <Table.Td w={110}>
                                  <NumberInput
                                    aria-label="Target"
                                    value={row.values.target}
                                    onChange={(value) => setFieldValue(slug, 'target', toNumberOrEmpty(value))}
                                    error={row.fieldErrors.target}
                                    clampBehavior="none"
                                  />
                                </Table.Td>
                                <Table.Td w={110}>
                                  <NumberInput
                                    aria-label="Max"
                                    value={row.values.max}
                                    onChange={(value) => setFieldValue(slug, 'max', toNumberOrEmpty(value))}
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
                                      onClick={() => void saveRow(slug)}
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
