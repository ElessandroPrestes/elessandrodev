export const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 3
export const DEFAULT_CIRCUIT_BREAKER_MS = 60000

export function createCircuitBreaker({
  threshold = DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
  cooldownMs = DEFAULT_CIRCUIT_BREAKER_MS,
  now = () => Date.now(),
} = {}) {
  const safeThreshold = Number.isFinite(threshold)
    ? Math.max(1, Math.floor(threshold))
    : DEFAULT_CIRCUIT_BREAKER_THRESHOLD
  const safeCooldown = Number.isFinite(cooldownMs)
    ? Math.max(1000, Math.floor(cooldownMs))
    : DEFAULT_CIRCUIT_BREAKER_MS

  const failures = new Map()
  const openUntil = new Map()

  function isOpen(key) {
    const until = openUntil.get(key)
    if (!until) return false

    if (now() >= until) {
      openUntil.delete(key)
      failures.delete(key)
      return false
    }

    return true
  }

  function recordFailure(key) {
    const count = (failures.get(key) || 0) + 1
    failures.set(key, count)

    if (count >= safeThreshold) {
      openUntil.set(key, now() + safeCooldown)
    }
  }

  function recordSuccess(key) {
    failures.delete(key)
    openUntil.delete(key)
  }

  function reset() {
    failures.clear()
    openUntil.clear()
  }

  return { isOpen, recordFailure, recordSuccess, reset }
}
