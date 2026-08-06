import { useCallback, useEffect, useState } from 'react'
import { toParameterConfigs, listParameters, type ParameterConfig } from '../../api/parameters'
import { getThreshold, type ThresholdParameter, type ThresholdRecord } from '../../api/thresholds'
import type { MeasurementParameter } from '../../api/measurements'
import { toUserMessage } from '../../api/client'

function emptyThresholds(parameters: ParameterConfig[]): Record<MeasurementParameter, ThresholdRecord | null> {
  const thresholds: Record<MeasurementParameter, ThresholdRecord | null> = {}
  for (const parameter of parameters) {
    thresholds[parameter.slug] = null
  }
  return thresholds
}

/**
 * Loads the parameter catalog and, for a selected aquarium, each parameter's
 * threshold (read-only — used to draw min/target/max reference lines on the
 * trend charts, not editable here; editing lives in useAquariumThresholds).
 */
export function useMeasurementParameters(aquariumId: string | null) {
  const [parameters, setParameters] = useState<ParameterConfig[]>([])
  const [parametersLoading, setParametersLoading] = useState(true)
  const [parametersError, setParametersError] = useState('')
  const [thresholds, setThresholds] = useState<Record<MeasurementParameter, ThresholdRecord | null>>({})

  const loadParameters = useCallback(async (signal?: AbortSignal) => {
    setParametersLoading(true)
    setParametersError('')

    try {
      const records = await listParameters(signal)
      setParameters(toParameterConfigs(records))
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
      if (!aquariumId) return

      // A parameter can appear in the catalog before the backend's fixed
      // threshold rule set recognizes it, so isolate failures per-parameter
      // instead of letting one unsupported parameter blank out every
      // threshold (missing threshold just means "no reference lines").
      const results = await Promise.allSettled(
        parameters.map((parameter) => getThreshold(aquariumId, parameter.slug as ThresholdParameter, signal)),
      )

      const next: Record<MeasurementParameter, ThresholdRecord | null> = {}
      parameters.forEach((parameter, index) => {
        const result = results[index]
        next[parameter.slug] = result.status === 'fulfilled' ? result.value : null
      })
      setThresholds(next)
    },
    [aquariumId, parameters],
  )

  useEffect(() => {
    if (!aquariumId || parameters.length === 0) {
      setThresholds(emptyThresholds(parameters))
      return
    }

    const controller = new AbortController()
    void loadThresholds(controller.signal)
    return () => controller.abort()
  }, [aquariumId, parameters, loadThresholds])

  return {
    parameters,
    parametersLoading,
    parametersError,
    retryParameters: loadParameters,
    thresholds,
  }
}
