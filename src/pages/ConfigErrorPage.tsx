import { Box, Code, Heading, Stack, Text } from '@chakra-ui/react'
import { configErrors } from '../config'

export function ConfigErrorPage() {
  const errors = configErrors()

  return (
    <Box maxW="480px" mx="auto" mt={12} px={6}>
      <Heading size="md" mb={2}>
        ⚙️ Configuration Error
      </Heading>
      <Text color="fg.muted" mb={4} fontSize="sm">
        The application cannot start because required environment variables are missing.
        Create a <Code>.env.local</Code> file (see <Code>.env.example</Code>) and restart
        the dev server.
      </Text>
      <Stack gap={2}>
        {errors.map((err) => (
          <Box
            key={err}
            bg="red.subtle"
            borderRadius="md"
            px={3}
            py={2}
            borderWidth="1px"
            borderColor="red.emphasized"
          >
            <Text color="red.fg" fontSize="sm">
              {err}
            </Text>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
