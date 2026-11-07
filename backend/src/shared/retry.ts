import { isAbortError, statusFromUnknown } from './errors.js'

export interface RetryOptions {
  attempts: number
  baseMs?: number
  maxMs?: number
  signal?: AbortSignal
  shouldRetry?: (error: unknown, attempt: number) => boolean
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
}

export function isTransientStatus(status: number | undefined): boolean {
  if (!status) return false
  return status === 408 || status === 425 || status === 429 || status >= 500
}

export function isTransientError(error: unknown): boolean {
  if (!error) return false
  if (isAbortError(error)) return true

  const status = statusFromUnknown(error)
  if (status) return isTransientStatus(status)

  const message = String((error as Error)?.message ?? error).toLowerCase()
  return (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('socket hang up') ||
    message.includes('unavailable') ||
    message.includes('overloaded') ||
    message.includes('high demand')
  )
}

export function calculateBackoff(
  attempt: number,
  baseMs = 500,
  maxMs = 10000,
): number {
  const safeBase = Number.isFinite(baseMs) ? Math.max(1, baseMs) : 500
  const exponential = safeBase * 2 ** Math.max(0, attempt - 1)
  const jitter = Math.floor(Math.random() * safeBase)
  return Math.min(maxMs, exponential + jitter)
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    function onAbort() {
      clearTimeout(timer)
      reject(signal?.reason)
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export async function retryWithBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  {
    attempts,
    baseMs = 500,
    maxMs = 10000,
    signal,
    shouldRetry = isTransientError,
    onRetry,
  }: RetryOptions,
): Promise<T> {
  const safeAttempts = Math.max(1, Math.floor(attempts))
  let lastError: unknown

  for (let attempt = 1; attempt <= safeAttempts; attempt += 1) {
    if (signal?.aborted) throw signal.reason

    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      if (attempt >= safeAttempts || !shouldRetry(error, attempt)) break

      const delayMs = calculateBackoff(attempt, baseMs, maxMs)
      onRetry?.(error, attempt, delayMs)
      await sleep(delayMs, signal)
    }
  }

  throw lastError
}
