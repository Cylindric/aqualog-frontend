import type { ReactNode } from 'react'
import { Box, Text } from '@mantine/core'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/**
 * Dashed-box empty-state block, used wherever a list/table has nothing to
 * show yet (no aquariums, no measurement history, no chart data). Previously
 * duplicated inline across AquariumsPage/MeasurementsPage.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Box
      py="xl"
      px="md"
      ta="center"
      style={{
        border: '1px dashed var(--mantine-color-dark-4)',
        borderRadius: 'var(--mantine-radius-md)',
      }}
    >
      <Text size="lg" fw={500} mb="xs">
        {title}
      </Text>
      {description ? (
        <Text c="dimmed" mb={action ? 'md' : undefined}>
          {description}
        </Text>
      ) : null}
      {action}
    </Box>
  )
}
