import { useState, useCallback } from 'react'
import { calculateSalinityDose, type SalinityDoseParams, type SalinityDoseResponse } from '../../api/salinity'
import { toUserMessage } from '../../api/client'

interface CalculatorState {
  loading: boolean
  result: SalinityDoseResponse | null
  error: string | null
}

export function useSalinityCalculator() {
  const [state, setState] = useState<CalculatorState>({
    loading: false,
    result: null,
    error: null,
  })

  const calculate = useCallback(async (params: SalinityDoseParams) => {
    setState({ loading: true, result: null, error: null })
    try {
      const result = await calculateSalinityDose(params)
      setState({ loading: false, result, error: null })
    } catch (error) {
      setState({ loading: false, result: null, error: toUserMessage(error) })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ loading: false, result: null, error: null })
  }, [])

  return { ...state, calculate, reset }
}
