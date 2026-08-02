import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Box, Card, SimpleGrid, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import { useNavigate } from 'react-router'
import { listAquariums } from '../api/aquariums'
import { IconCalculator, IconMeasurements } from '../components/primaryNav'

interface FeatureCard {
  title: string
  description: string
  icon: ReactNode
  route: string
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Salinity Calculator',
    description: 'Calculate salt requirements for water changes',
    icon: <IconCalculator size={26} />,
    route: '/calculator',
  },
  {
    title: 'Measurements',
    description: 'Add salinity readings and review historical trends',
    icon: <IconMeasurements size={26} />,
    route: '/measurements',
  },
]

type StatState = 'loading' | 'ready' | 'error'

export function DashboardPage() {
  const navigate = useNavigate()
  const [statState, setStatState] = useState<StatState>('loading')
  const [aquariumCount, setAquariumCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listAquariums(controller.signal)
      .then((records) => {
        setAquariumCount(records.length)
        setStatState('ready')
      })
      .catch(() => setStatState('error'))

    return () => controller.abort()
  }, [])

  return (
    <Box maw={1200} mx="auto" py="xl">
      <Stack gap="xl">
        <Box>
          <Title order={1} mb="xs">
            Dashboard
          </Title>
          <Text c="dimmed" size="lg">
            Welcome to your aquarium management portal
          </Text>
        </Box>

        <Card withBorder shadow="sm" padding="md" maw={220}>
          <Stack gap={4}>
            <Text size="10px" tt="uppercase" c="accent" fw={600} style={{ letterSpacing: '0.1em' }}>
              Tracked
            </Text>
            {statState === 'loading' && <Text fw={600} size="lg">&hellip;</Text>}
            {statState === 'error' && <Text fw={600} size="lg" c="dimmed">Unavailable</Text>}
            {statState === 'ready' && (
              <Text fw={600} size="lg">
                {aquariumCount} {aquariumCount === 1 ? 'aquarium' : 'aquariums'}
              </Text>
            )}
          </Stack>
        </Card>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {FEATURES.map((feature) => (
            <UnstyledButton
              key={feature.route}
              onClick={() => navigate(feature.route)}
              p="lg"
              style={{
                background: 'var(--mantine-color-dark-6)',
                borderRadius: 'var(--mantine-radius-md)',
                boxShadow: 'var(--mantine-shadow-sm)',
              }}
            >
              <Stack gap="10px" align="flex-start">
                <Box c="accent">{feature.icon}</Box>
                <Text size="lg" fw={600} ta="left">
                  {feature.title}
                </Text>
                <Text size="sm" c="dimmed" ta="left">
                  {feature.description}
                </Text>
              </Stack>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  )
}
