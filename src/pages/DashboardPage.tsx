import { Box, Button, Grid, SimpleGrid, Stack, Text, Title } from '@mantine/core'
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
    <Box maw={1200} mx="auto" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Box>
          <Title order={1} mb="xs">
            Dashboard
          </Title>
          <Text c="dimmed" size="lg">
            Welcome to your aquarium management portal
          </Text>
        </Box>

        {/* Feature Cards Grid */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {FEATURES.map((feature) => (
            <Button
              key={feature.route}
              onClick={() => navigate(feature.route)}
              variant="default"
              justify="flex-start"
              h="auto"
              p="lg"
              style={{ border: '1px solid var(--mantine-color-gray-3)' }}
            >
              <Grid gutter="md" align="flex-start">
                <Grid.Col span={12}>
                  <Text size="3xl" lh={1}>
                    {feature.icon}
                  </Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Stack gap="xs" align="flex-start">
                    <Text size="lg" fw={600} ta="left">
                      {feature.title}
                    </Text>
                    <Text size="sm" c="dimmed" ta="left">
                      {feature.description}
                    </Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Button>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  )
}
