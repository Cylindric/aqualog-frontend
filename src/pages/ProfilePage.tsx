import { Stack, Title } from '@mantine/core'
import { ProfileView } from '../features/profile/ProfileView'

export function ProfilePage() {
  return (
    <Stack gap="md" pb="md">
      <Title order={2}>My Profile</Title>
      <ProfileView />
    </Stack>
  )
}
