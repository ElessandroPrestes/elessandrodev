export interface CircuitBreaker {
  isOpen(key: string): boolean
  recordFailure(key: string): void
  recordSuccess(key: string): void
  reset(): void
}

export function createCircuitBreaker({
  threshold = 3,
  cooldownMs = 60000,
  now = () => Date.now(),
}: {
  threshold?: number
  cooldownMs?: number
  now?: () => number
} = {}): CircuitBreaker {
  const safeThreshold = Number.isFinite(threshold)
    ? Math.max(1, Math.floor(threshold))
    : 3
  const safeCooldown = Number.isFinite(cooldownMs)
    ? Math.max(1000, Math.floor(cooldownMs))
    : 60000

  const failures = new Map<string, number>()
  const openUntil = new Map<string, number>()

  function isOpen(key: string): boolean {
    const until = openUntil.get(key)
    if (!until) return false

    if (now() >= until) {
      openUntil.delete(key)
      failures.delete(key)
      return false
    }

    return true
  }

  function recordFailure(key: string): void {
    const count = (failures.get(key) ?? 0) + 1
    failures.set(key, count)

    if (count >= safeThreshold) {
      openUntil.set(key, now() + safeCooldown)
    }
  }

  function recordSuccess(key: string): void {
    failures.delete(key)
    openUntil.delete(key)
  }

  function reset(): void {
    failures.clear()
    openUntil.clear()
  }

  return { isOpen, recordFailure, recordSuccess, reset }
}
