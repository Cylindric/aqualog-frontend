import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Drawer,
  Flex,
  Group,
  Modal,
  NumberInput,
  Skeleton,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import {
  type AquariumRecord,
  createAquarium,
  deleteAquarium,
  listAquariums,
  updateAquarium,
} from '../api/aquariums'
import { ApiRequestError, toUserMessage } from '../api/client'

interface AquariumFormValues {
  name: string
  type: string
  volumeValue: number | ''
  volumeUnit: 'L' | 'gal_us'
}

type ViewState = 'loading' | 'ready' | 'error'

const AQUARIUM_TYPES = [
  'Saltwater Reef',
  'Saltwater FOWLR',
  'Freshwater Planted',
  'Freshwater Community',
]

const defaultFormValues = (): AquariumFormValues => ({
  name: '',
  type: AQUARIUM_TYPES[0],
  volumeValue: '',
  volumeUnit: 'L',
})

export function AquariumsPage() {
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [pageError, setPageError] = useState('')
  const [aquariums, setAquariums] = useState<AquariumRecord[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAquarium, setSelectedAquarium] = useState<AquariumRecord | null>(null)
  const [formValues, setFormValues] = useState<AquariumFormValues>(defaultFormValues())
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AquariumFormValues, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingAquariumId, setDeletingAquariumId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [aquariumPendingDelete, setAquariumPendingDelete] = useState<AquariumRecord | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void loadAquariums(controller.signal)

    return () => {
      controller.abort()
    }
  }, [])

  const drawerTitle = useMemo(
    () => (selectedAquarium ? 'Edit Aquarium' : 'Add Aquarium'),
    [selectedAquarium],
  )

  const handleAdd = () => {
    setSelectedAquarium(null)
    setFormValues(defaultFormValues())
    setFormErrors({})
    setSubmitError('')
    setDrawerOpen(true)
  }

  const handleEdit = (aquarium: AquariumRecord) => {
    setSelectedAquarium(aquarium)
    setFormValues({
      name: aquarium.name,
      type: aquarium.type,
      volumeValue: Number(aquarium.volumeLiters.toFixed(2)),
      volumeUnit: 'L',
    })
    setFormErrors({})
    setSubmitError('')
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    if (saving) return

    setDrawerOpen(false)
    setSelectedAquarium(null)
    setFormErrors({})
    setSubmitError('')
  }

  const handleRetry = () => {
    void loadAquariums()
  }

  const handleRequestDelete = (aquarium: AquariumRecord) => {
    if (deletingAquariumId) return

    setAquariumPendingDelete(aquarium)
    setDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    if (deletingAquariumId) return

    setDeleteModalOpen(false)
    setAquariumPendingDelete(null)
  }

  const handleDelete = async () => {
    if (!aquariumPendingDelete) return

    setDeletingAquariumId(aquariumPendingDelete.id)
    try {
      await deleteAquarium(aquariumPendingDelete.id)
      setAquariums((current) => current.filter((item) => item.id !== aquariumPendingDelete.id))
      setDeleteModalOpen(false)
      setAquariumPendingDelete(null)
    } catch (error) {
      setPageError(toUserMessage(error))
      setViewState('error')
    } finally {
      setDeletingAquariumId(null)
    }
  }

  const handleSubmit = async () => {
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

      if (selectedAquarium) {
        const updated = await updateAquarium(selectedAquarium.id, payload)
        setAquariums((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        )
      } else {
        const created = await createAquarium(payload)
        setAquariums((current) => [created, ...current])
      }

      handleCloseDrawer()
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
    setViewState('loading')
    setPageError('')

    try {
      const response = await listAquariums(signal)
      setAquariums(response)
      setViewState('ready')
    } catch (error) {
      setPageError(toUserMessage(error))
      setViewState('error')
    }
  }

  return (
    <Stack gap="md" pb="md">
      <Flex justify="space-between" align="center">
        <Title order={2}>My Aquariums</Title>
        <Button onClick={handleAdd} disabled={viewState === 'loading'}>
          Add Aquarium
        </Button>
      </Flex>

      {viewState === 'loading' && <AquariumsLoadingState />}

      {viewState === 'error' && (
        <Alert color="red" variant="light" title="Could not load aquariums">
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

      {viewState === 'ready' && aquariums.length === 0 ? (
        <Box
          py="xl"
          px="md"
          ta="center"
          style={{
            border: '1px dashed var(--mantine-color-gray-4)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <Text size="lg" fw={500} mb="xs">
            No aquariums yet
          </Text>
          <Text c="dimmed" mb="md">
            Add your first aquarium to start tracking maintenance and parameters
          </Text>
          <Button onClick={handleAdd}>Add Your First Aquarium</Button>
        </Box>
      ) : null}

      {viewState === 'ready' && aquariums.length > 0 ? (
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th visibleFrom="sm">Volume</Table.Th>
              <Table.Th visibleFrom="md">Created</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {aquariums.map((aquarium) => (
              <Table.Tr key={aquarium.id}>
                <Table.Td fw={500}>{aquarium.name}</Table.Td>
                <Table.Td visibleFrom="sm">{aquarium.type}</Table.Td>
                <Table.Td>
                  {formatLiters(aquarium.volumeLiters)}
                </Table.Td>
                <Table.Td visibleFrom="md">
                  {formatDate(aquarium.createdAt)}
                </Table.Td>
                <Table.Td>
                  <Group justify="end" gap="xs">
                    <Button size="compact-sm" variant="subtle" onClick={() => handleEdit(aquarium)}>
                      Edit
                    </Button>
                    <Button
                      size="compact-sm"
                      variant="subtle"
                      color="red"
                      loading={deletingAquariumId === aquarium.id}
                      onClick={() => handleRequestDelete(aquarium)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : null}

      <Modal
        opened={deleteModalOpen && aquariumPendingDelete !== null}
        onClose={handleCloseDeleteModal}
        title="Delete Aquarium"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {`Delete aquarium "${aquariumPendingDelete?.name ?? ''}"? This action cannot be undone.`}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseDeleteModal} disabled={Boolean(deletingAquariumId)}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={Boolean(deletingAquariumId)}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Drawer
        opened={drawerOpen}
        onClose={handleCloseDrawer}
        position="right"
        size="md"
        title={drawerTitle}
      >
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

          <Group grow>
            <Button variant="default" onClick={handleCloseDrawer} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} loading={saving}>
              {selectedAquarium ? 'Save Changes' : 'Add Aquarium'}
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </Stack>
  )
}

function AquariumsLoadingState() {
  return (
    <Stack gap="sm">
      <Skeleton h={44} radius="md" />
      <Skeleton h={44} radius="md" />
      <Skeleton h={44} radius="md" />
    </Stack>
  )
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

function mapApiValidationErrors(
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

function formatLiters(value: number): string {
  return `${value.toFixed(1)} L`
}
