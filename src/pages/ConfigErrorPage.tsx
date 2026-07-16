import { Box, Code, Stack, Text, Title } from '@mantine/core'
import { configErrors } from '../config'

export function ConfigErrorPage() {
  const errors = configErrors()

  return (
    <Box maw={480} mx="auto" mt="xl" px="md">
      <Title order={3} mb="xs">
        ⚙️ Configuration Error
      </Title>
      <Text c="dimmed" mb="md" size="sm">
        The application cannot start because runtime configuration could not be loaded.
        Ensure the backend <Code>/api/runtime-config</Code> endpoint is reachable and
        provides the required <Code>AQUALOG_*</Code> values.
      </Text>
      <Stack gap="xs">
        {errors.map((err) => (
          <Box
            key={err}
            bg="var(--mantine-color-red-0)"
            px="sm"
            py="xs"
            style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-red-4)' }}
          >
            <Text c="red.8" size="sm">
              {err}
            </Text>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
