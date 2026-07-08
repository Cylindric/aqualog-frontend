import { type FormEvent, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Field,
  Heading,
  Input,
  Stack,
  Stat,
  Text,
} from '@chakra-ui/react'
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
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [field]: e.target.value }
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
    <Stack gap={6}>
      <Box>
        <Heading size="md" mb={1}>
          Salinity Dose Calculator
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Calculate how much salt to add to raise salinity to your target level.
        </Text>
      </Box>

      <Card.Root variant="outline">
        <Card.Body>
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap={4}>
              <Field.Root invalid={!!errors.volume}>
                <Field.Label>
                  Volume{' '}
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    (litres)
                  </Text>
                </Field.Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0.01"
                  placeholder="e.g. 200"
                  value={values.volume}
                  onChange={handleChange('volume')}
                  disabled={loading}
                />
                <Field.ErrorText>{errors.volume}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.current}>
                <Field.Label>
                  Current salinity{' '}
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    (‰ PPT)
                  </Text>
                </Field.Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 0"
                  value={values.current}
                  onChange={handleChange('current')}
                  disabled={loading}
                />
                <Field.ErrorText>{errors.current}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.target}>
                <Field.Label>
                  Target salinity{' '}
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    (‰ PPT)
                  </Text>
                </Field.Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 35"
                  value={values.target}
                  onChange={handleChange('target')}
                  disabled={loading}
                />
                <Field.ErrorText>{errors.target}</Field.ErrorText>
                <Field.HelperText>Typical reef salinity: 33–36 ‰</Field.HelperText>
              </Field.Root>

              <Button type="submit" colorPalette="blue" loading={loading} w="full" size="lg">
                Calculate
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>

      {/* Result area */}
      {!result && !error && !loading && (
        <Box
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.subtle"
          borderRadius="xl"
          px={6}
          py={8}
          textAlign="center"
        >
          <Text fontSize="2xl" mb={2}>
            🧂
          </Text>
          <Text color="fg.muted" fontSize="sm">
            Enter your tank volume and salinity levels above, then tap Calculate to
            see the salt dose.
          </Text>
        </Box>
      )}

      {error && (
        <Box
          bg="red.subtle"
          borderRadius="xl"
          px={5}
          py={4}
          borderWidth="1px"
          borderColor="red.emphasized"
        >
          <Text fontWeight="semibold" color="red.fg" mb={1}>
            Calculation failed
          </Text>
          <Text color="red.fg" fontSize="sm">
            {error}
          </Text>
        </Box>
      )}

      {result && (
        <Card.Root variant="elevated" bg="blue.subtle">
          <Card.Body>
            <Stat.Root>
              <Stat.Label color="fg.muted" fontSize="sm">
                Salt to add
              </Stat.Label>
              <Stat.ValueText fontSize="3xl" fontWeight="bold" color="fg.default">
                {formatDoseResult(result)}
              </Stat.ValueText>
              <Stat.HelpText color="fg.muted" fontSize="xs" mt={1}>
                For {values.volume} L · {values.current} → {values.target} ‰
              </Stat.HelpText>
            </Stat.Root>
          </Card.Body>
        </Card.Root>
      )}
    </Stack>
  )
}
