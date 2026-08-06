import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { type MeasurementParameter } from '../api/measurements'
import { EmptyState } from '../components/EmptyState'
import { useAquariumsList } from '../features/aquariums/useAquariumsList'
import { useMeasurementParameters } from '../features/measurements/useMeasurementParameters'
import { useMeasurementHistory } from '../features/measurements/useMeasurementHistory'
import {
  type MeasurementFormErrors,
  type MeasurementFormValues,
  defaultMeasurementFormValues,
  validateMeasurement,
} from '../features/measurements/measurementForm'
import { ParameterTrendChart } from '../features/measurements/ParameterTrendChart'
import { MeasurementHistoryTable } from '../features/measurements/MeasurementHistoryTable'

interface PendingDelete {
  id: string
  parameter: MeasurementParameter
}

export function MeasurementsPage() {
  const {
    status: aquariumsStatus,
    aquariums,
    error: aquariumsError,
    retry: retryAquariums,
  } = useAquariumsList()
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(null)

  // Default to the first aquarium once the list loads, without overriding a
  // selection the user already made (e.g. by retrying after an error).
  useEffect(() => {
    if (aquariumsStatus === 'ready' && !selectedAquariumId) {
      setSelectedAquariumId(aquariums[0]?.id ?? null)
    }
  }, [aquariumsStatus, aquariums, selectedAquariumId])

  const { parameters, parametersLoading, parametersError, retryParameters, thresholds } =
    useMeasurementParameters(selectedAquariumId)

  const {
    viewState,
    historyError,
    retryHistory,
    sortedMeasurements,
    measurementsByParameter,
    saving,
    submitError,
    lastSubmit,
    submitMeasurement,
    retrySubmit,
    deletingMeasurementId,
    deleteError,
    lastDeleteAttempt,
    deleteMeasurementById,
    retryDelete,
  } = useMeasurementHistory(selectedAquariumId, parameters)

  const [formValues, setFormValues] = useState<MeasurementFormValues>(defaultMeasurementFormValues([]))
  const [formErrors, setFormErrors] = useState<MeasurementFormErrors>({})

  // Keep the entry form's fields in sync with the current parameter catalog
  // (fires on initial load and on every successful retry).
  useEffect(() => {
    setFormValues(defaultMeasurementFormValues(parameters))
  }, [parameters])

  const [showEmpty, setShowEmpty] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  const aquariumOptions = aquariums.map((aquarium) => ({ value: aquarium.id, label: aquarium.name }))

  const handleValueChange = (parameter: MeasurementParameter, value: number | '') => {
    setFormValues((current) => ({
      ...current,
      values: { ...current.values, [parameter]: value },
    }))
  }

  const handleFormSubmit = async () => {
    const validation = validateMeasurement(formValues, parameters)
    if (Object.keys(validation).length > 0) {
      setFormErrors(validation)
      return
    }

    setFormErrors({})
    const { fieldErrors, savedCount } = await submitMeasurement(formValues)
    if (Object.keys(fieldErrors).length > 0) {
      setFormErrors(fieldErrors)
    }
    if (savedCount > 0) {
      setFormValues(defaultMeasurementFormValues(parameters))
    }
  }

  const requestDeleteMeasurement = (measurementId: string, parameter: MeasurementParameter, shiftKey: boolean) => {
    if (shiftKey) {
      void deleteMeasurementById(measurementId, parameter)
      return
    }
    setPendingDelete({ id: measurementId, parameter })
  }

  const cancelPendingDelete = () => setPendingDelete(null)

  const confirmPendingDelete = () => {
    if (!pendingDelete) return
    const { id, parameter } = pendingDelete
    setPendingDelete(null)
    void deleteMeasurementById(id, parameter)
  }

  const aquariumsLoading = aquariumsStatus === 'loading'

  return (
    <Stack gap="lg" pb="md">
      <Stack gap={2}>
        <Title order={2}>Aquarium Measurements</Title>
        <Text c="dimmed" size="sm">
          Record parameter readings, review historical trends, and remove incorrect entries.
        </Text>
      </Stack>

      {(aquariumsLoading || parametersLoading) && <MeasurementsLoadingState />}

      {!aquariumsLoading && aquariumsStatus === 'error' && (
        <Alert color="red" title="Could not load aquariums">
          <Stack gap="sm">
            <Text size="sm">{aquariumsError}</Text>
            <Group>
              <Button variant="outline" size="xs" onClick={retryAquariums}>
                Retry
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {!aquariumsLoading && !parametersLoading && aquariumsStatus !== 'error' && parametersError && (
        <Alert color="red" title="Could not load parameters">
          <Stack gap="sm">
            <Text size="sm">{parametersError}</Text>
            <Group>
              <Button variant="outline" size="xs" onClick={() => void retryParameters()}>
                Retry
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {!aquariumsLoading &&
        !parametersLoading &&
        aquariumsStatus !== 'error' &&
        !parametersError &&
        aquariums.length === 0 && (
          <EmptyState
            title="No aquariums available"
            description="Add an aquarium in the Aquariums section before recording measurements."
          />
        )}

      {!aquariumsLoading &&
        aquariumsStatus !== 'error' &&
        !parametersLoading &&
        !parametersError &&
        aquariums.length > 0 && (
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
                    <Table.ScrollContainer minWidth={400}>
                      <Table verticalSpacing="xs">
                        <Table.Tbody>
                          {parameters.map((parameter) => (
                            <Table.Tr key={parameter.slug}>
                              <Table.Td>{parameter.displayName}</Table.Td>
                              <Table.Td w={150}>
                                <NumberInput
                                  aria-label={`${parameter.displayName} (${parameter.unit})`}
                                  value={formValues.values[parameter.slug]}
                                  onChange={(value) =>
                                    handleValueChange(parameter.slug, value === '' ? '' : Number(value))
                                  }
                                  error={formErrors[parameter.slug]}
                                  allowNegative={false}
                                  min={0.01}
                                  clampBehavior="none"
                                  placeholder="Enter value"
                                  disabled={saving}
                                />
                              </Table.Td>
                              <Table.Td>{parameter.unit}</Table.Td>
                            </Table.Tr>
                          ))}
                          <Table.Tr>
                            <Table.Td>
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
                              /><Button fullWidth onClick={() => void handleFormSubmit()} loading={saving}>Add</Button>
                            </Table.Td>
                          </Table.Tr>
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Grid>

                  {submitError && (
                    <Alert color="red" title="Could not save one or more measurements">
                      <Stack gap="sm">
                        <Text size="sm">{submitError}</Text>
                        <Group>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={retrySubmit}
                            disabled={!lastSubmit || saving}
                          >
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
                            onClick={retryDelete}
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
                    <Button variant="outline" size="xs" onClick={() => void retryHistory()}>
                      Retry
                    </Button>
                  </Group>
                </Stack>
              </Alert>
            )}

            {viewState === 'ready' && sortedMeasurements.length === 0 && (
              <EmptyState
                title="No measurement history yet"
                description="Add your first measurements above to begin trend tracking."
              />
            )}

            {viewState === 'ready' && sortedMeasurements.length > 0 && (
              <Stack gap="md">
                {parameters.map((parameter) => (
                  <Stack gap="md" key={parameter.slug}>
                    <ParameterTrendChart
                      parameter={parameter}
                      measurements={measurementsByParameter[parameter.slug]}
                      threshold={thresholds[parameter.slug]}
                      showEmpty={showEmpty}
                    />
                    <MeasurementHistoryTable
                      parameter={parameter}
                      measurements={measurementsByParameter[parameter.slug]}
                      deletingMeasurementId={deletingMeasurementId}
                      onDelete={requestDeleteMeasurement}
                      showEmpty={showEmpty}
                    />
                  </Stack>
                ))}
              </Stack>
            )}

            <Checkbox
              label="Show empty tables and charts"
              checked={showEmpty}
              onChange={(event) => setShowEmpty(event.currentTarget.checked)}
            />
          </>
        )}

      <Modal opened={pendingDelete !== null} onClose={cancelPendingDelete} title="Delete measurement?" centered>
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this{' '}
            {pendingDelete
              ? parameters.find((parameter) => parameter.slug === pendingDelete.parameter)?.displayName
              : ''}{' '}
            measurement? This cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={cancelPendingDelete}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmPendingDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
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
