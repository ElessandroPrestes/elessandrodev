import { TimeoutError } from './errors.js'

export function timeoutSignal(
  timeoutMs: number,
  external?: AbortSignal,
): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  if (!external) return timeout
  return AbortSignal.any([external, timeout])
}

export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  external?: AbortSignal,
): Promise<T> {
  const signal = timeoutSignal(timeoutMs, external)

  try {
    return await operation(signal)
  } catch (error) {
    if (signal.aborted && !external?.aborted) {
      throw new TimeoutError()
    }
    throw error
  }
}
