import { Anchor, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <Stack gap="md" pt="xl" ta="center" align="center">
      <Text size="3xl">🔍</Text>
      <Title order={3}>Page not found</Title>
      <Text c="dimmed" size="sm">
        The page you were looking for doesn't exist.
      </Text>
      <Anchor component={Link} to="/">
        Return to Calculator
      </Anchor>
    </Stack>
  )
}
