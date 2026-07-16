import { useState } from 'react'
import {
  Box,
  Button,
  Drawer,
  Flex,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'

interface Aquarium {
  id: string
  name: string
  volume: number
  volumeUnit: string
  type: string
  setupDate: string
}

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
    <Stack gap="md" pb="80px">
      <Flex justify="space-between" align="center">
        <Title order={2}>My Aquariums</Title>
        <Button onClick={handleAdd}>Add Aquarium</Button>
      </Flex>

      {aquariums.length === 0 ? (
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
      ) : (
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Volume</Table.Th>
              <Table.Th visibleFrom="md">Setup Date</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {aquariums.map((aquarium) => (
              <Table.Tr key={aquarium.id}>
                <Table.Td fw={500}>{aquarium.name}</Table.Td>
                <Table.Td visibleFrom="sm">{aquarium.type}</Table.Td>
                <Table.Td>
                  {aquarium.volume} {aquarium.volumeUnit}
                </Table.Td>
                <Table.Td visibleFrom="md">
                  {new Date(aquarium.setupDate).toLocaleDateString()}
                </Table.Td>
                <Table.Td>
                  <Button size="compact-sm" variant="subtle" onClick={() => handleEdit(aquarium)}>
                    Edit
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Drawer
        opened={drawerOpen}
        onClose={handleCloseDrawer}
        position="right"
        size="md"
        title={selectedAquarium ? 'Edit Aquarium' : 'Add Aquarium'}
      >
        <Stack gap="md">
          <TextInput
            label="Aquarium Name"
            placeholder="e.g., Living Room Reef"
            defaultValue={selectedAquarium?.name}
            description="Give your aquarium a memorable name"
          />

          <Select
            label="Type"
            placeholder="Select type..."
            defaultValue={selectedAquarium?.type}
            data={[
              'Saltwater Reef',
              'Saltwater FOWLR',
              'Freshwater Planted',
              'Freshwater Community',
            ]}
          />

          <Group align="end" grow>
            <NumberInput
              label="Volume"
              placeholder="75"
              defaultValue={selectedAquarium?.volume}
              allowNegative={false}
              clampBehavior="none"
            />

            <Select
              label="Unit"
              defaultValue={selectedAquarium?.volumeUnit}
              data={[
                { label: 'gal', value: 'gallons' },
                { label: 'L', value: 'liters' },
              ]}
            />
          </Group>

          <TextInput
            label="Setup Date"
            type="date"
            defaultValue={selectedAquarium?.setupDate}
          />

          <Group grow>
            <Button variant="default" onClick={handleCloseDrawer}>
              Cancel
            </Button>
            <Button onClick={handleCloseDrawer}>
              {selectedAquarium ? 'Save Changes' : 'Add Aquarium'}
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </Stack>
  )
}
