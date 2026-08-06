import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAsync } from '../../hooks/useAsync'

describe('useAsync', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useAsync<string>())
    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('tracks loading then ready on success', async () => {
    const { result } = renderHook(() => useAsync<string>())

    act(() => {
      void result.current.run(() => Promise.resolve('done'))
    })
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.data).toBe('done')
    expect(result.current.error).toBeNull()
  })

  it('tracks error with a user-facing message on failure', async () => {
    const { result } = renderHook(() => useAsync<string>())

    await act(async () => {
      await result.current.run(() => Promise.reject(new TypeError('network down')))
    })

    expect(result.current.status).toBe('error')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Could not reach the backend. Check your network connection and API URL.')
  })

  it('ignores an aborted request instead of surfacing an error', async () => {
    const { result } = renderHook(() => useAsync<string>())

    await act(async () => {
      await result.current.run(() => Promise.reject(new DOMException('aborted', 'AbortError')))
    })

    expect(result.current.status).toBe('loading')
    expect(result.current.error).toBeNull()
  })

  it('retry re-runs the most recent task', async () => {
    const { result } = renderHook(() => useAsync<number>())
    let calls = 0
    const task = () => {
      calls += 1
      return Promise.resolve(calls)
    }

    await act(async () => {
      await result.current.run(task)
    })
    expect(result.current.data).toBe(1)

    await act(async () => {
      result.current.retry()
    })
    expect(result.current.data).toBe(2)
  })

  it('retry is a no-op before anything has run', () => {
    const { result } = renderHook(() => useAsync<string>())

    act(() => {
      result.current.retry()
    })

    expect(result.current.status).toBe('idle')
  })

  it('setData updates data directly, with an updater function seeing the current value', async () => {
    const { result } = renderHook(() => useAsync<number[]>())

    await act(async () => {
      await result.current.run(() => Promise.resolve([1, 2]))
    })
    expect(result.current.data).toEqual([1, 2])

    act(() => {
      result.current.setData((current) => [0, ...(current ?? [])])
    })
    expect(result.current.data).toEqual([0, 1, 2])
  })
})
