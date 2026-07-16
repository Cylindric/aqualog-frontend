import { Box, Button, Container, Grid, Heading, Stack, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router'

interface FeatureCard {
  title: string
  description: string
  icon: string
  route: string
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Salinity Calculator',
    description: 'Calculate salt requirements for water changes',
    icon: '⚗️',
    route: '/calculator',
  },
]

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={8}>
        {/* Header */}
        <Box>
          <Heading size="2xl" mb={2}>
            Dashboard
          </Heading>
          <Text color="fg.muted" fontSize="lg">
            Welcome to your aquarium management portal
          </Text>
        </Box>

        {/* Feature Cards Grid */}
        <Grid
          templateColumns={{
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
          gap={4}
        >
          {FEATURES.map((feature) => (
            <Button
              key={feature.route}
              onClick={() => navigate(feature.route)}
              height="auto"
              py={6}
              px={5}
              flexDirection="column"
              alignItems="flex-start"
              gap={3}
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.subtle"
              rounded="lg"
              _hover={{
                borderColor: 'colorPalette.500',
                bg: 'bg.subtle',
              }}
              colorPalette="blue"
            >
              <Text fontSize="3xl" lineHeight="1">
                {feature.icon}
              </Text>
              <Stack gap={1} alignItems="flex-start">
                <Text fontSize="lg" fontWeight="semibold" color="fg">
                  {feature.title}
                </Text>
                <Text fontSize="sm" color="fg.muted" textAlign="left">
                  {feature.description}
                </Text>
              </Stack>
            </Button>
          ))}
        </Grid>
      </Stack>
    </Container>
  )
}
