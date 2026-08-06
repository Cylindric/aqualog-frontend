import { useCallback, useEffect, useState } from 'react'
import { type AquariumRecord, getAquarium, updateAquarium } from '../../api/aquariums'
import { ApiRequestError, toUserMessage } from '../../api/client'
import { type AquariumFormValues, toAquariumUpdatePayload } from './aquariumForm'

export type AquariumDetailViewState = 'loading' | 'ready' | 'error' | 'not-found'

/** Loads a single aquarium by id and exposes an update mutation for its own fields. */
export function useAquariumDetail(id: string | undefined) {
  const [viewState, setViewState] = useState<AquariumDetailViewState>('loading')
  const [pageError, setPageError] = useState('')
  const [aquarium, setAquarium] = useState<AquariumRecord | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) {
        setViewState('not-found')
        return
      }

      setViewState('loading')
      setPageError('')

      try {
        const record = await getAquarium(id, signal)
        setAquarium(record)
        setViewState('ready')
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) {
          setViewState('not-found')
          return
        }
        setPageError(toUserMessage(error))
        setViewState('error')
      }
    },
    [id],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const update = useCallback(
    async (values: AquariumFormValues) => {
      if (!id) throw new Error('Cannot update an aquarium without an id.')

      setSaving(true)
      setSubmitError('')
      try {
        const updated = await updateAquarium(id, toAquariumUpdatePayload(values))
        setAquarium(updated)
        return updated
      } catch (error) {
        setSubmitError(toUserMessage(error))
        throw error
      } finally {
        setSaving(false)
      }
    },
    [id],
  )

  return { viewState, pageError, aquarium, retry: load, saving, submitError, update }
}
