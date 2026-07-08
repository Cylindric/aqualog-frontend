import { useState, useCallback, useEffect } from 'react'
import { checkReadiness } from '../api/client'
import { toUserMessage } from '../api/client'

type ReadinessState = 'loading' | 'ready' | 'error'

export function useReadinessCheck() {
  const [state, setState] = useState<ReadinessState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const check = useCallback(async () => {
    setState('loading')
    setErrorMessage('')
    try {
      await checkReadiness()
      setState('ready')
    } catch (error) {
      setErrorMessage(toUserMessage(error))
      setState('error')
    }
  }, [])

  useEffect(() => {
    check()
  }, [check])

  return { state, errorMessage, retry: check }
}
