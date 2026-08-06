import type { ParameterConfig } from '../../api/parameters'
import type { MeasurementParameter } from '../../api/measurements'
import type { ApiRequestError } from '../../api/client'

export type ParameterValues = Record<MeasurementParameter, number | ''>

export interface MeasurementFormValues {
  values: ParameterValues
  measuredAtLocal: string
}

export type MeasurementFormErrors = Partial<Record<MeasurementParameter | 'measuredAtLocal', string>>

function emptyParameterValues(parameters: ParameterConfig[]): ParameterValues {
  const values: ParameterValues = {}
  for (const parameter of parameters) {
    values[parameter.slug] = ''
  }
  return values
}

export function defaultMeasurementFormValues(parameters: ParameterConfig[]): MeasurementFormValues {
  return {
    values: emptyParameterValues(parameters),
    measuredAtLocal: new Date().toISOString().slice(0, 16),
  }
}

export function validateMeasurement(
  values: MeasurementFormValues,
  parameters: ParameterConfig[],
): MeasurementFormErrors {
  const errors: MeasurementFormErrors = {}

  const hasAnyValue = parameters.some((parameter) => values.values[parameter.slug] !== '')

  if (!hasAnyValue) {
    const message = 'Enter at least one measurement value to submit.'
    for (const parameter of parameters) {
      errors[parameter.slug] = message
    }
  }

  for (const parameter of parameters) {
    const value = values.values[parameter.slug]
    if (value !== '' && (Number.isNaN(Number(value)) || Number(value) <= 0)) {
      errors[parameter.slug] = `Enter a ${parameter.displayName.toLowerCase()} value greater than 0 ${parameter.unit}.`
    }
  }

  if (!values.measuredAtLocal) {
    errors.measuredAtLocal = 'Choose when the measurement was taken.'
  }

  return errors
}

export function mapMeasurementValidationErrors(
  error: ApiRequestError,
  parameterKey: MeasurementParameter,
): MeasurementFormErrors {
  const errors: MeasurementFormErrors = {}

  for (const item of error.validationErrors ?? []) {
    if (item.loc.includes('value')) {
      errors[parameterKey] = item.msg
    }

    if (item.loc.includes('measured_at')) {
      errors.measuredAtLocal = item.msg
    }
  }

  return errors
}

export function toIsoString(localDateTime: string): string {
  const date = new Date(localDateTime)
  if (Number.isNaN(date.getTime())) {
    return localDateTime
  }

  return date.toISOString()
}
