import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createMeasurementByParameter,
  deleteMeasurement,
  listMeasurementsByParameter,
  type MeasurementParameter,
  type MeasurementRecord,
} from '../../api/measurements'
import type { ParameterConfig } from '../../api/parameters'
import { ApiRequestError, toUserMessage } from '../../api/client'
import {
  type MeasurementFormErrors,
  type MeasurementFormValues,
  mapMeasurementValidationErrors,
  toIsoString,
} from './measurementForm'

export type MeasurementHistoryViewState = 'idle' | 'loading' | 'ready' | 'error'

interface LastDeleteAttempt {
  id: string
  parameter: MeasurementParameter
}

interface SubmitResult {
  fieldErrors: MeasurementFormErrors
  savedCount: number
}

/**
 * Loads measurement history for a selected aquarium (one request per
 * parameter, tolerating individual failures) and exposes create/delete
 * mutations that reload the history on success.
 */
export function useMeasurementHistory(aquariumId: string | null, parameters: ParameterConfig[]) {
  const [viewState, setViewState] = useState<MeasurementHistoryViewState>('idle')
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([])
  const [historyError, setHistoryError] = useState('')

  const loadMeasurements = useCallback(
    async (signal?: AbortSignal) => {
      if (!aquariumId || parameters.length === 0) {
        setMeasurements([])
        setViewState('idle')
        return
      }

      setViewState('loading')
      setHistoryError('')

      // A parameter can appear in the catalog before the backend's fixed
      // measurement rule set recognizes it, so isolate failures per-parameter
      // instead of letting one unsupported parameter blank out the whole page.
      // Only surface the error banner if every request failed.
      const results = await Promise.allSettled(
        parameters.map((parameter) => listMeasurementsByParameter(aquariumId, parameter.slug, signal)),
      )

      const fulfilled = results.filter(
        (result): result is PromiseFulfilledResult<MeasurementRecord[]> => result.status === 'fulfilled',
      )
      const firstRejection = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )

      if (fulfilled.length === 0 && firstRejection) {
        setHistoryError(toUserMessage(firstRejection.reason))
        setViewState('error')
        return
      }

      setMeasurements(fulfilled.flatMap((result) => result.value))
      setViewState('ready')
    },
    [aquariumId, parameters],
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadMeasurements(controller.signal)
    return () => controller.abort()
  }, [loadMeasurements])

  const sortedMeasurements = useMemo(
    () => [...measurements].sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt)),
    [measurements],
  )

  const measurementsByParameter = useMemo(() => {
    const grouped: Record<MeasurementParameter, MeasurementRecord[]> = {}
    for (const parameter of parameters) {
      grouped[parameter.slug] = sortedMeasurements.filter((measurement) => measurement.parameter === parameter.slug)
    }
    return grouped
  }, [sortedMeasurements, parameters])

  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [lastSubmit, setLastSubmit] = useState<MeasurementFormValues | null>(null)

  const submitMeasurement = useCallback(
    async (values: MeasurementFormValues): Promise<SubmitResult> => {
      if (!aquariumId) {
        setSubmitError('Select an aquarium before submitting a measurement.')
        return { fieldErrors: {}, savedCount: 0 }
      }

      setSaving(true)
      setSubmitError('')
      setLastSubmit(values)

      const fieldErrors: MeasurementFormErrors = {}
      const failureMessages: string[] = []
      let savedCount = 0

      try {
        for (const parameter of parameters) {
          const value = values.values[parameter.slug]
          if (value === '') continue

          try {
            await createMeasurementByParameter(aquariumId, parameter.slug, {
              value: Number(value),
              unit: parameter.unit,
              measuredAt: toIsoString(values.measuredAtLocal),
            })
            savedCount += 1
          } catch (error) {
            failureMessages.push(`${parameter.displayName}: ${toUserMessage(error)}`)
            if (error instanceof ApiRequestError && error.validationErrors?.length) {
              Object.assign(fieldErrors, mapMeasurementValidationErrors(error, parameter.slug))
            }
          }
        }

        if (savedCount > 0) {
          await loadMeasurements()
        }

        if (failureMessages.length > 0) {
          setSubmitError(failureMessages.join(' | '))
        }

        return { fieldErrors, savedCount }
      } finally {
        setSaving(false)
      }
    },
    [aquariumId, parameters, loadMeasurements],
  )

  const retrySubmit = useCallback(() => {
    if (lastSubmit) void submitMeasurement(lastSubmit)
  }, [lastSubmit, submitMeasurement])

  const [deletingMeasurementId, setDeletingMeasurementId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [lastDeleteAttempt, setLastDeleteAttempt] = useState<LastDeleteAttempt | null>(null)

  const deleteMeasurementById = useCallback(
    async (measurementId: string, parameter: MeasurementParameter) => {
      if (!aquariumId) return

      setDeletingMeasurementId(measurementId)
      setDeleteError('')
      setLastDeleteAttempt({ id: measurementId, parameter })

      try {
        await deleteMeasurement(aquariumId, parameter, measurementId)
        await loadMeasurements()
      } catch (error) {
        setDeleteError(toUserMessage(error))
      } finally {
        setDeletingMeasurementId(null)
      }
    },
    [aquariumId, loadMeasurements],
  )

  const retryDelete = useCallback(() => {
    if (lastDeleteAttempt) void deleteMeasurementById(lastDeleteAttempt.id, lastDeleteAttempt.parameter)
  }, [lastDeleteAttempt, deleteMeasurementById])

  return {
    viewState,
    historyError,
    retryHistory: loadMeasurements,
    sortedMeasurements,
    measurementsByParameter,
    saving,
    submitError,
    lastSubmit,
    submitMeasurement,
    retrySubmit,
    deletingMeasurementId,
    deleteError,
    lastDeleteAttempt,
    deleteMeasurementById,
    retryDelete,
  }
}
