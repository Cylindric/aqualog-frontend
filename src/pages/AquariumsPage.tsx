import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Alert,
  Button,
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
import { type AquariumRecord } from '../api/aquariums'
import { ApiRequestError } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { useAquariumsList } from '../features/aquariums/useAquariumsList'
import {
  AQUARIUM_TYPES,
  type AquariumFormValues,
  defaultAquariumFormValues,
  mapAquariumValidationErrors,
  toAquariumUpdatePayload,
  validateAquariumForm,
} from '../features/aquariums/aquariumForm'

export function AquariumsPage() {
  const navigate = useNavigate()
  const {
    status,
    aquariums,
    error: pageError,
    retry,
    creating,
    createError,
    create,
    dismissCreateError,
    deletingId,
    deleteError,
    remove,
    dismissDeleteError,
  } = useAquariumsList()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formValues, setFormValues] = useState<AquariumFormValues>(defaultAquariumFormValues())
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AquariumFormValues, string>>>({})
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [aquariumPendingDelete, setAquariumPendingDelete] = useState<AquariumRecord | null>(null)

  const handleAdd = () => {
    setFormValues(defaultAquariumFormValues())
    setFormErrors({})
    dismissCreateError()
    setDrawerOpen(true)
  }

  const handleEdit = (aquarium: AquariumRecord) => {
    navigate(`/aquariums/${aquarium.id}`)
  }

  const handleCloseDrawer = () => {
    if (creating) return

    setDrawerOpen(false)
    setFormErrors({})
    dismissCreateError()
  }

  const handleRequestDelete = (aquarium: AquariumRecord) => {
    if (deletingId) return

    dismissDeleteError()
    setAquariumPendingDelete(aquarium)
    setDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    if (deletingId) return

    setDeleteModalOpen(false)
    setAquariumPendingDelete(null)
    dismissDeleteError()
  }

  const handleDelete = async () => {
    if (!aquariumPendingDelete) return

    try {
      await remove(aquariumPendingDelete.id)
      setDeleteModalOpen(false)
      setAquariumPendingDelete(null)
    } catch {
      // remove() already recorded deleteError; leave the modal open (rather
      // than the original's page-wide error banner) so the user sees the
      // failure in place and can retry or cancel without losing the list.
    }
  }

  const handleSubmit = async () => {
    const clientValidation = validateAquariumForm(formValues)
    if (Object.keys(clientValidation).length > 0) {
      setFormErrors(clientValidation)
      return
    }

    setFormErrors({})

    try {
      await create(toAquariumUpdatePayload(formValues))
      handleCloseDrawer()
    } catch (error) {
      // create() already recorded createError for display below; only the
      // field-level validation mapping is this component's job.
      if (error instanceof ApiRequestError && error.validationErrors?.length) {
        setFormErrors(mapAquariumValidationErrors(error))
      }
    }
  }

  return (
    <Stack gap="md" pb="md">
      <Flex justify="space-between" align="center">
        <Title order={2}>My Aquariums</Title>
        <Button onClick={handleAdd} disabled={status === 'loading'}>
          Add Aquarium
        </Button>
      </Flex>

      {status === 'loading' && <AquariumsLoadingState />}

      {status === 'error' && (
        <Alert color="red" variant="light" title="Could not load aquariums">
          <Stack gap="sm">
            <Text size="sm">{pageError}</Text>
            <Group>
              <Button size="xs" variant="outline" onClick={retry}>
                Retry
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {status === 'ready' && aquariums.length === 0 ? (
        <EmptyState
          title="No aquariums yet"
          description="Add your first aquarium to start tracking maintenance and parameters"
          action={<Button onClick={handleAdd}>Add Your First Aquarium</Button>}
        />
      ) : null}

      {status === 'ready' && aquariums.length > 0 ? (
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
                      loading={deletingId === aquarium.id}
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
          {deleteError ? <Text c="red" size="sm">{deleteError}</Text> : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseDeleteModal} disabled={Boolean(deletingId)}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={Boolean(deletingId)}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={drawerOpen}
        onClose={handleCloseDrawer}
        title="Add Aquarium"
        centered
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

          {createError ? <Text c="red" size="sm">{createError}</Text> : null}

          <Group grow>
            <Button variant="default" onClick={handleCloseDrawer} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} loading={creating}>
              Add Aquarium
            </Button>
          </Group>
        </Stack>
      </Modal>
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

function formatLiters(value: number): string {
  return `${value.toFixed(1)} L`
}
