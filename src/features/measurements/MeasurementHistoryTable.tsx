import { Alert, Button, Card, Stack, Table, Text } from '@mantine/core'
import type { ParameterConfig } from '../../api/parameters'
import type { MeasurementParameter, MeasurementRecord } from '../../api/measurements'

interface MeasurementHistoryTableProps {
  parameter: ParameterConfig
  measurements: MeasurementRecord[]
  deletingMeasurementId: string | null
  onDelete: (measurementId: string, parameter: MeasurementParameter, shiftKey: boolean) => void
  showEmpty: boolean
}

export function MeasurementHistoryTable({
  parameter,
  measurements,
  deletingMeasurementId,
  onDelete,
  showEmpty,
}: MeasurementHistoryTableProps) {
  const title = `${parameter.displayName} History`

  if (measurements.length === 0) {
    if (!showEmpty) return null

    return (
      <Alert color="gray" title={`${title} unavailable`}>
        <Text size="sm">No {parameter.displayName.toLowerCase()} entries are available yet for this aquarium.</Text>
      </Alert>
    )
  }

  return (
    <Card withBorder>
      <Card.Section p="md" data-testid={`${parameter.slug}-history-table`}>
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
                    {measurement.value} {parameter.unit}
                  </Table.Td>
                  <Table.Td ta="right">
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      loading={deletingMeasurementId === measurement.id}
                      onClick={(event) => onDelete(measurement.id, measurement.parameter, event.shiftKey)}
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

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}
