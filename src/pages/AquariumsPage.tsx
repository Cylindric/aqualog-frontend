import { useState } from 'react'
import {
  Box,
  Button,
  Drawer,
  Flex,
  Heading,
  IconButton,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react'
import { Field } from '@chakra-ui/react'

// Mock data type
interface Aquarium {
  id: string
  name: string
  volume: number
  volumeUnit: string
  type: string
  setupDate: string
}

// Mock data
const MOCK_AQUARIUMS: Aquarium[] = [
  {
    id: '1',
    name: 'Living Room Reef',
    volume: 75,
    volumeUnit: 'gallons',
    type: 'Saltwater Reef',
    setupDate: '2024-03-15',
  },
  {
    id: '2',
    name: 'Office Nano',
    volume: 20,
    volumeUnit: 'gallons',
    type: 'Saltwater FOWLR',
    setupDate: '2025-11-02',
  },
  {
    id: '3',
    name: 'Bedroom Planted',
    volume: 40,
    volumeUnit: 'gallons',
    type: 'Freshwater Planted',
    setupDate: '2023-08-20',
  },
]

export function AquariumsPage() {
  const [aquariums] = useState<Aquarium[]>(MOCK_AQUARIUMS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAquarium, setSelectedAquarium] = useState<Aquarium | null>(null)

  const handleAdd = () => {
    setSelectedAquarium(null)
    setDrawerOpen(true)
  }

  const handleEdit = (aquarium: Aquarium) => {
    setSelectedAquarium(aquarium)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedAquarium(null)
  }

  return (
    <Stack gap={4} pb={20}>
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Heading size="lg">My Aquariums</Heading>
        <Button colorPalette="blue" onClick={handleAdd}>
          Add Aquarium
        </Button>
      </Flex>

      {/* Empty state */}
      {aquariums.length === 0 ? (
        <Box
          py={12}
          px={4}
          textAlign="center"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.subtle"
          rounded="lg"
        >
          <Text fontSize="lg" fontWeight="medium" mb={2}>
            No aquariums yet
          </Text>
          <Text color="fg.muted" mb={4}>
            Add your first aquarium to start tracking maintenance and parameters
          </Text>
          <Button colorPalette="blue" onClick={handleAdd}>
            Add Your First Aquarium
          </Button>
        </Box>
      ) : (
        /* Table */
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Type</Table.ColumnHeader>
              <Table.ColumnHeader>Volume</Table.ColumnHeader>
              <Table.ColumnHeader hideBelow="md">Setup Date</Table.ColumnHeader>
              <Table.ColumnHeader w="20" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {aquariums.map((aquarium) => (
              <Table.Row key={aquarium.id}>
                <Table.Cell fontWeight="medium">{aquarium.name}</Table.Cell>
                <Table.Cell hideBelow="sm">{aquarium.type}</Table.Cell>
                <Table.Cell>
                  {aquarium.volume} {aquarium.volumeUnit}
                </Table.Cell>
                <Table.Cell hideBelow="md">
                  {new Date(aquarium.setupDate).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(aquarium)}
                  >
                    Edit
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      {/* Drawer for Add/Edit */}
      <Drawer.Root
        open={drawerOpen}
        onOpenChange={(e) => !e.open && handleCloseDrawer()}
        placement="end"
        size="md"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>
                {selectedAquarium ? 'Edit Aquarium' : 'Add Aquarium'}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  ✕
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body>
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Aquarium Name</Field.Label>
                  <input
                    type="text"
                    placeholder="e.g., Living Room Reef"
                    defaultValue={selectedAquarium?.name}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--chakra-colors-border-subtle)',
                    }}
                  />
                  <Field.HelperText>
                    Give your aquarium a memorable name
                  </Field.HelperText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Type</Field.Label>
                  <select
                    defaultValue={selectedAquarium?.type}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--chakra-colors-border-subtle)',
                    }}
                  >
                    <option value="">Select type...</option>
                    <option value="Saltwater Reef">Saltwater Reef</option>
                    <option value="Saltwater FOWLR">Saltwater FOWLR</option>
                    <option value="Freshwater Planted">Freshwater Planted</option>
                    <option value="Freshwater Community">
                      Freshwater Community
                    </option>
                  </select>
                </Field.Root>

                <Flex gap={2}>
                  <Field.Root flex={2}>
                    <Field.Label>Volume</Field.Label>
                    <input
                      type="number"
                      placeholder="75"
                      defaultValue={selectedAquarium?.volume}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--chakra-colors-border-subtle)',
                      }}
                    />
                  </Field.Root>

                  <Field.Root flex={1}>
                    <Field.Label>Unit</Field.Label>
                    <select
                      defaultValue={selectedAquarium?.volumeUnit}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--chakra-colors-border-subtle)',
                      }}
                    >
                      <option value="gallons">gal</option>
                      <option value="liters">L</option>
                    </select>
                  </Field.Root>
                </Flex>

                <Field.Root>
                  <Field.Label>Setup Date</Field.Label>
                  <input
                    type="date"
                    defaultValue={selectedAquarium?.setupDate}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--chakra-colors-border-subtle)',
                    }}
                  />
                </Field.Root>
              </Stack>
            </Drawer.Body>

            <Drawer.Footer>
              <Flex gap={2} width="full">
                <Button flex={1} variant="outline" onClick={handleCloseDrawer}>
                  Cancel
                </Button>
                <Button flex={1} colorPalette="blue" onClick={handleCloseDrawer}>
                  {selectedAquarium ? 'Save Changes' : 'Add Aquarium'}
                </Button>
              </Flex>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Stack>
  )
}
