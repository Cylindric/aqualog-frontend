import { useCallback, useEffect, useState } from 'react'
import {
  type AquariumRecord,
  type CreateAquariumInput,
  createAquarium,
  deleteAquarium,
  listAquariums,
} from '../../api/aquariums'
import { toUserMessage } from '../../api/client'
import { useAsync } from '../../hooks/useAsync'

/**
 * Loads the current user's aquarium list, and exposes create/delete
 * mutations that update the loaded list locally rather than re-fetching.
 */
export function useAquariumsList() {
  const list = useAsync<AquariumRecord[]>()

  useEffect(() => {
    const controller = new AbortController()
    void list.run((signal) => listAquariums(signal), controller.signal)
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- list.run is a stable useCallback; only re-run on mount
  }, [])

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const create = useCallback(
    async (input: CreateAquariumInput) => {
      setCreating(true)
      setCreateError('')
      try {
        const created = await createAquarium(input)
        list.setData((current) => [created, ...(current ?? [])])
        return created
      } catch (error) {
        setCreateError(toUserMessage(error))
        throw error
      } finally {
        setCreating(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- list.setData is a stable useCallback
    [],
  )

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const remove = useCallback(
    async (aquariumId: string) => {
      setDeletingId(aquariumId)
      setDeleteError('')
      try {
        await deleteAquarium(aquariumId)
        list.setData((current) => (current ?? []).filter((item) => item.id !== aquariumId))
      } catch (error) {
        setDeleteError(toUserMessage(error))
        throw error
      } finally {
        setDeletingId(null)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- list.setData is a stable useCallback
    [],
  )

  const dismissCreateError = useCallback(() => setCreateError(''), [])
  const dismissDeleteError = useCallback(() => setDeleteError(''), [])

  return {
    status: list.status,
    aquariums: list.data ?? [],
    error: list.error,
    retry: list.retry,
    creating,
    createError,
    create,
    dismissCreateError,
    deletingId,
    deleteError,
    remove,
    dismissDeleteError,
  }
}
