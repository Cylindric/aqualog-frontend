import { Heading, Text, VStack } from '@chakra-ui/react'
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <VStack gap={4} pt={12} textAlign="center">
      <Text fontSize="3xl">🔍</Text>
      <Heading size="md">Page not found</Heading>
      <Text color="fg.muted" fontSize="sm">
        The page you were looking for doesn't exist.
      </Text>
      <Link to="/">Return to Calculator</Link>
    </VStack>
  )
}
