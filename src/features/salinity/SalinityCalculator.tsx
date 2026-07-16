import { type FormEvent, useState } from 'react'
import { Alert, Box, Button, Card, NumberInput, Stack, Text, Title } from '@mantine/core'
import { useSalinityCalculator } from './useSalinityCalculator'
import { formatDoseResult } from '../../api/salinity'

interface FormValues {
  volume: string
  current: string
  target: string
}

interface FormErrors {
  volume?: string
  current?: string
  target?: string
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  const volume = parseFloat(values.volume)
  const current = parseFloat(values.current)
  const target = parseFloat(values.target)

  if (!values.volume || isNaN(volume) || volume <= 0) {
    errors.volume = 'Enter a volume greater than 0'
  }
  if (values.current === '' || isNaN(current) || current < 0) {
    errors.current = 'Enter a current salinity of 0 or above'
  }
  if (!values.target || isNaN(target) || target <= 0) {
    errors.target = 'Enter a target salinity greater than 0'
  }
  if (!errors.current && !errors.target && current >= target) {
    errors.target = 'Target salinity must be higher than current salinity'
  }

  return errors
}

export function SalinityCalculator() {
  const { loading, result, error, calculate, reset } = useSalinityCalculator()
  const [values, setValues] = useState<FormValues>({ volume: '', current: '', target: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function handleChange(field: keyof FormValues) {
    return (value: string | number) => {
      const next = { ...values, [field]: value === '' ? '' : String(value) }
      setValues(next)
      if (submitted) setErrors(validate(next))
      reset()
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)

    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    calculate({
      volume: parseFloat(values.volume),
      current: parseFloat(values.current),
      target: parseFloat(values.target),
    })
  }

  return (
    <Stack gap="lg">
      <Box>
        <Title order={3} mb="xs">
          Salinity Dose Calculator
        </Title>
        <Text c="dimmed" size="sm">
          Calculate how much salt to add to raise salinity to your target level.
        </Text>
      </Box>

      <Card withBorder>
        <Card.Section p="md">
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              <NumberInput
                label="Volume (litres)"
                error={errors.volume}
                decimalScale={2}
                allowNegative={false}
                min={0.01}
                clampBehavior="none"
                placeholder="e.g. 200"
                value={values.volume}
                onChange={handleChange('volume')}
                disabled={loading}
              />

              <NumberInput
                label="Current salinity (‰ PPT)"
                error={errors.current}
                decimalScale={1}
                allowNegative={false}
                min={0}
                clampBehavior="none"
                placeholder="e.g. 0"
                value={values.current}
                onChange={handleChange('current')}
                disabled={loading}
              />

              <NumberInput
                label="Target salinity (‰ PPT)"
                description="Typical reef salinity: 33-36 ‰"
                error={errors.target}
                decimalScale={1}
                allowNegative={false}
                min={0.1}
                clampBehavior="none"
                placeholder="e.g. 35"
                value={values.target}
                onChange={handleChange('target')}
                disabled={loading}
              />

              <Button type="submit" loading={loading} fullWidth>
                Calculate
              </Button>
            </Stack>
          </form>
        </Card.Section>
      </Card>

      {!result && !error && !loading && (
        <Box
          p="xl"
          ta="center"
          style={{
            border: '1px dashed var(--mantine-color-gray-4)',
            borderRadius: 'var(--mantine-radius-xl)',
          }}
        >
          <Text size="2rem" mb="xs">
            🧂
          </Text>
          <Text c="dimmed" size="sm">
            Enter your tank volume and salinity levels above, then tap Calculate to
            see the salt dose.
          </Text>
        </Box>
      )}

      {error && (
        <Alert color="red" title="Calculation failed">
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      {result && (
        <Card withBorder bg="blue.0">
          <Card.Section p="md">
            <Stack gap="xs">
              <Text c="dimmed" size="sm">
                Salt to add
              </Text>
              <Text size="2rem" fw={700}>
                {formatDoseResult(result)}
              </Text>
              <Text c="dimmed" size="xs">
                For {values.volume} L · {values.current} → {values.target} ‰
              </Text>
            </Stack>
          </Card.Section>
        </Card>
      )}
    </Stack>
  )
}
