import { useCallback, useRef, useState } from 'react'
import { toUserMessage } from '../api/client'

export type AsyncStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface UseAsyncState<T> {
  status: AsyncStatus
  data: T | null
  error: string | null
}

export interface UseAsyncResult<T> extends UseAsyncState<T> {
  /** Runs `task`, tracking status/data/error. Re-running replaces the previous result. */
  run: (task: (signal?: AbortSignal) => Promise<T>, signal?: AbortSignal) => Promise<T | undefined>
  /** Re-runs the most recent `task` passed to `run`. No-op if nothing has run yet. */
  retry: () => void
  /**
   * Updates `data` directly without going through `run`/`status`. For
   * reflecting a mutation's result locally (e.g. an item created/deleted via
   * its own request) into an already-loaded list, rather than re-fetching.
   */
  setData: (updater: T | ((current: T | null) => T)) => void
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * Tracks a single in-flight async operation as {status, data, error}, the
 * tri-state shape hand-rolled per-resource across the page components. Not a
 * data-fetching cache — one operation at a time, no dedupe/sharing.
 */
export function useAsync<T>(): UseAsyncResult<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  })
  const lastTaskRef = useRef<((signal?: AbortSignal) => Promise<T>) | null>(null)

  const run = useCallback(async (task: (signal?: AbortSignal) => Promise<T>, signal?: AbortSignal) => {
    lastTaskRef.current = task
    setState({ status: 'loading', data: null, error: null })

    try {
      const result = await task(signal)
      setState({ status: 'ready', data: result, error: null })
      return result
    } catch (error) {
      // A stale request aborted by a dependency change (not a real failure)
      // shouldn't flash an error state over whatever request superseded it.
      if (isAbortError(error)) return undefined

      setState({ status: 'error', data: null, error: toUserMessage(error) })
      return undefined
    }
  }, [])

  const retry = useCallback(() => {
    if (lastTaskRef.current) {
      void run(lastTaskRef.current)
    }
  }, [run])

  const setData = useCallback((updater: T | ((current: T | null) => T)) => {
    setState((current) => ({
      ...current,
      data: typeof updater === 'function' ? (updater as (current: T | null) => T)(current.data) : updater,
    }))
  }, [])

  return { ...state, run, retry, setData }
}
