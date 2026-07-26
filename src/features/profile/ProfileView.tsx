import { useEffect, useState } from 'react'
import { Alert, Button, Card, Group, Skeleton, Stack, Text, TextInput } from '@mantine/core'
import { useProfile } from './useProfile'
import { toUserMessage } from '../../api/client'

const MAX_DISPLAY_NAME_LENGTH = 120

function validateDisplayName(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return 'Display name is required'
  }
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer`
  }
  return undefined
}

export function ProfileView() {
  const { profile, isLoading, error, refetch, save } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
    }
  }, [profile])

  const handleChange = (value: string) => {
    setDisplayName(value)
    setSaveSuccess(false)
    if (fieldError) {
      setFieldError(validateDisplayName(value))
    }
  }

  const handleSave = async () => {
    const validationError = validateDisplayName(displayName)
    setFieldError(validationError)
    if (validationError) return

    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      const updated = await save(displayName.trim())
      setDisplayName(updated.display_name ?? '')
      setSaveSuccess(true)
    } catch (error) {
      setSaveError(toUserMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Stack gap="sm">
        <Skeleton h={24} w={200} />
        <Skeleton h={44} />
        <Skeleton h={44} />
      </Stack>
    )
  }

  if (error || !profile) {
    return (
      <Alert color="red" variant="light" title="Could not load profile">
        <Stack gap="sm">
          <Text size="sm">{error ?? 'Unknown error'}</Text>
          <Group>
            <Button size="xs" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </Group>
        </Stack>
      </Alert>
    )
  }

  return (
    <Card withBorder>
      <Card.Section p="md">
        <Stack gap="md">
          <div>
            <Text c="dimmed" size="sm">
              Username
            </Text>
            <Text fw={500}>{profile.username ?? '—'}</Text>
          </div>

          <div>
            <Text c="dimmed" size="sm">
              Member since
            </Text>
            <Text fw={500}>{formatDate(profile.created_at)}</Text>
          </div>

          <TextInput
            label="Display name"
            value={displayName}
            onChange={(event) => handleChange(event.currentTarget.value)}
            error={fieldError}
            disabled={saving}
          />

          {saveError ? (
            <Alert color="red" title="Could not save changes">
              <Text size="sm">{saveError}</Text>
            </Alert>
          ) : null}

          {saveSuccess ? (
            <Alert color="green" title="Saved">
              <Text size="sm">Your display name has been updated.</Text>
            </Alert>
          ) : null}

          <Group justify="flex-end">
            <Button onClick={() => void handleSave()} loading={saving}>
              Save changes
            </Button>
          </Group>
        </Stack>
      </Card.Section>
    </Card>
  )
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}
