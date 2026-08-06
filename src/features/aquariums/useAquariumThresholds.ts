import { useCallback, useEffect, useState } from 'react'
import { toParameterConfigs, listParameters, type ParameterConfig } from '../../api/parameters'
import {
  THRESHOLD_SANITY_RANGES,
  getThreshold,
  setThreshold,
  type ThresholdParameter,
} from '../../api/thresholds'
import { ApiRequestError, toUserMessage } from '../../api/client'

export interface ThresholdFieldValues {
  min: number | ''
  target: number | ''
  max: number | ''
}

export interface ThresholdRowState {
  values: ThresholdFieldValues
  loading: boolean
  saving: boolean
  error: string
  fieldErrors: Partial<Record<keyof ThresholdFieldValues, string>>
}

export type ThresholdRowsState = Partial<Record<ThresholdParameter, ThresholdRowState>>

function emptyThresholdValues(): ThresholdFieldValues {
  return { min: '', target: '', max: '' }
}

export function defaultThresholdRowState(): ThresholdRowState {
  return {
    values: emptyThresholdValues(),
    loading: true,
    saving: false,
    error: '',
    fieldErrors: {},
  }
}

function seedThresholdRows(configs: ParameterConfig[]): ThresholdRowsState {
  const rows: ThresholdRowsState = {}
  for (const config of configs) {
    rows[config.slug as ThresholdParameter] = defaultThresholdRowState()
  }
  return rows
}

export function validateThresholdRow(
  parameter: ThresholdParameter,
  values: ThresholdFieldValues,
): Partial<Record<keyof ThresholdFieldValues, string>> {
  const errors: Partial<Record<keyof ThresholdFieldValues, string>> = {}
  // A parameter can appear in the catalog before the backend's fixed threshold
  // sanity-range table recognizes it, so skip the bound check (letting the
  // backend validate) rather than throwing on an unrecognized parameter.
  const range = THRESHOLD_SANITY_RANGES[parameter] as { min: number; max: number } | undefined

  const min = values.min === '' ? null : Number(values.min)
  const target = values.target === '' ? null : Number(values.target)
  const max = values.max === '' ? null : Number(values.max)

  if (range) {
    for (const [key, value] of [
      ['min', min],
      ['target', target],
      ['max', max],
    ] as const) {
      if (value !== null && (Number.isNaN(value) || value < range.min || value > range.max)) {
        errors[key] = `Must be between ${range.min} and ${range.max}`
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return errors
  }

  if (min !== null && target !== null && min > target) {
    errors.min = 'Min must be less than or equal to target'
  }
  if (target !== null && max !== null && target > max) {
    errors.max = 'Target must be less than or equal to max'
  }
  if (min !== null && max !== null && min > max) {
    errors.min = 'Min must be less than or equal to max'
  }

  return errors
}

function mapThresholdValidationErrors(error: ApiRequestError): Partial<Record<keyof ThresholdFieldValues, string>> {
  const errors: Partial<Record<keyof ThresholdFieldValues, string>> = {}

  for (const item of error.validationErrors ?? []) {
    if (item.loc.includes('min')) {
      errors.min = item.msg
    }
    if (item.loc.includes('target')) {
      errors.target = item.msg
    }
    if (item.loc.includes('max')) {
      errors.max = item.msg
    }
  }

  return errors
}

/**
 * Loads the parameter catalog and each parameter's threshold for a given
 * aquarium, and exposes a per-row save mutation for the limits editor.
 */
export function useAquariumThresholds(aquariumId: string | undefined) {
  const [parameters, setParameters] = useState<ParameterConfig[]>([])
  const [parametersLoading, setParametersLoading] = useState(true)
  const [parametersError, setParametersError] = useState('')
  const [thresholdRows, setThresholdRows] = useState<ThresholdRowsState>({})

  const loadParameters = useCallback(async (signal?: AbortSignal) => {
    setParametersLoading(true)
    setParametersError('')

    try {
      const records = await listParameters(signal)
      const configs = toParameterConfigs(records)
      setParameters(configs)
      setThresholdRows(seedThresholdRows(configs))
    } catch (error) {
      setParametersError(toUserMessage(error))
    } finally {
      setParametersLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadParameters(controller.signal)
    return () => controller.abort()
  }, [loadParameters])

  const loadThresholds = useCallback(
    async (signal?: AbortSignal) => {
      if (!aquariumId || parameters.length === 0) return

      await Promise.all(
        parameters.map(async (config) => {
          const slug = config.slug as ThresholdParameter
          try {
            const record = await getThreshold(aquariumId, slug, signal)
            setThresholdRows((current) => ({
              ...current,
              [slug]: {
                ...(current[slug] ?? defaultThresholdRowState()),
                values: {
                  min: record.min ?? '',
                  target: record.target ?? '',
                  max: record.max ?? '',
                },
                loading: false,
              },
            }))
          } catch (error) {
            setThresholdRows((current) => ({
              ...current,
              [slug]: {
                ...(current[slug] ?? defaultThresholdRowState()),
                loading: false,
                error: toUserMessage(error),
              },
            }))
          }
        }),
      )
    },
    [aquariumId, parameters],
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadThresholds(controller.signal)
    return () => controller.abort()
  }, [loadThresholds])

  const setFieldValue = useCallback(
    (parameter: ThresholdParameter, field: keyof ThresholdFieldValues, value: number | '') => {
      setThresholdRows((current) => {
        const row = current[parameter] ?? defaultThresholdRowState()
        return {
          ...current,
          [parameter]: { ...row, values: { ...row.values, [field]: value } },
        }
      })
    },
    [],
  )

  const saveRow = useCallback(
    async (parameter: ThresholdParameter) => {
      if (!aquariumId) return

      const row = thresholdRows[parameter]
      if (!row) return

      const fieldErrors = validateThresholdRow(parameter, row.values)
      if (Object.keys(fieldErrors).length > 0) {
        setThresholdRows((current) => ({
          ...current,
          [parameter]: { ...(current[parameter] ?? row), fieldErrors, error: '' },
        }))
        return
      }

      setThresholdRows((current) => ({
        ...current,
        [parameter]: { ...(current[parameter] ?? row), saving: true, error: '', fieldErrors: {} },
      }))

      try {
        const record = await setThreshold(aquariumId, parameter, {
          min: row.values.min === '' ? null : Number(row.values.min),
          target: row.values.target === '' ? null : Number(row.values.target),
          max: row.values.max === '' ? null : Number(row.values.max),
        })
        setThresholdRows((current) => ({
          ...current,
          [parameter]: {
            ...(current[parameter] ?? row),
            values: {
              min: record.min ?? '',
              target: record.target ?? '',
              max: record.max ?? '',
            },
            saving: false,
          },
        }))
      } catch (error) {
        const nextFieldErrors =
          error instanceof ApiRequestError && error.validationErrors?.length
            ? mapThresholdValidationErrors(error)
            : {}
        setThresholdRows((current) => ({
          ...current,
          [parameter]: {
            ...(current[parameter] ?? row),
            saving: false,
            error: toUserMessage(error),
            fieldErrors: nextFieldErrors,
          },
        }))
      }
    },
    [aquariumId, thresholdRows],
  )

  return {
    parameters,
    parametersLoading,
    parametersError,
    retryParameters: loadParameters,
    thresholdRows,
    setFieldValue,
    saveRow,
  }
}
