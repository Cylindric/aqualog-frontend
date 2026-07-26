import { useCallback, useEffect, useState } from 'react'
import { getMyProfile, updateMyProfile, type UserProfile } from '../../api/profile'
import { toUserMessage } from '../../api/client'

interface UseProfileState {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
}

export function useProfile() {
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    isLoading: true,
    error: null,
  })

  const load = useCallback(async (signal?: AbortSignal) => {
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      const profile = await getMyProfile(signal)
      setState({ profile, isLoading: false, error: null })
    } catch (error) {
      setState({ profile: null, isLoading: false, error: toUserMessage(error) })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)

    return () => {
      controller.abort()
    }
  }, [load])

  const save = useCallback(async (displayName: string) => {
    const updated = await updateMyProfile({ display_name: displayName })
    setState((current) => ({ ...current, profile: updated }))
    return updated
  }, [])

  const refetch = useCallback(() => load(), [load])

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    save,
  }
}
