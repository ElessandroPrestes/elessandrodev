export const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 3
export const DEFAULT_CIRCUIT_BREAKER_MS = 60000

const KEY = 'elessandrodev:chat:breaker:openrouter:v1'
const PROBE_LEASE_MS = 70000

// As transições usam o relógio do Redis e comparam a concessão antes de gravar.
const TRANSITION = `
local key = KEYS[1]
local op, token, ticket, outcome = ARGV[1], ARGV[2], ARGV[3], ARGV[4]
local threshold, cooldown, lease = tonumber(ARGV[5]), tonumber(ARGV[6]), tonumber(ARGV[7])
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
local value = redis.call('GET', key)
local state = value and cjson.decode(value) or {epoch = 'initial', failures = 0, untilMs = 0}
local function save()
  redis.call('SET', key, cjson.encode(state))
end
if op == 'acquire' then
  if now < state.untilMs then return 'open' end
  if state.untilMs > 0 then
    state.epoch, state.untilMs = token, now + lease
    save()
    return 'probe:' .. token
  end
  return 'closed:' .. state.epoch
end
if ticket == 'probe:' .. state.epoch and state.untilMs > 0 then
  if outcome == 'skipped' then
    state.untilMs = now
    save()
    return 'open'
  end
  if outcome == 'failure' then
    state.epoch, state.untilMs = token, now + cooldown
    save()
    return 'open'
  end
  state.epoch, state.failures, state.untilMs = token, 0, 0
  save()
  return 'closed'
end
if ticket ~= 'closed:' .. state.epoch or state.untilMs > 0 then return 'stale' end
if outcome == 'skipped' then return 'closed' end
if outcome == 'failure' then
  state.failures = state.failures + 1
  if state.failures >= threshold then
    state.epoch, state.untilMs = token, now + cooldown
    save()
    return 'open'
  end
elseif state.failures == 0 then
  return 'closed'
else
  state.failures = 0
end
save()
return 'closed'
`

export function createCircuitBreaker({ threshold, cooldownMs, now = Date.now }) {
  let epoch = 0
  let failures = 0
  let until = 0

  return {
    acquire() {
      if (now() < until) return 'open'
      if (!until) return `closed:${epoch}`
      until = now() + PROBE_LEASE_MS
      return `probe:${++epoch}`
    },
    finish(ticket, outcome) {
      if (ticket === `probe:${epoch}` && until) {
        epoch++
        if (outcome === 'skipped') {
          until = now()
          return 'open'
        }
        failures = 0
        until = outcome === 'failure' ? now() + cooldownMs : 0
      } else if (ticket === `closed:${epoch}` && !until) {
        if (outcome === 'skipped') return 'closed'
        failures = outcome === 'failure' ? failures + 1 : 0
        if (failures >= threshold) {
          epoch++
          until = now() + cooldownMs
        }
      } else {
        return 'stale'
      }
      return until ? 'open' : 'closed'
    },
  }
}

export function createSharedCircuit(redis, local, { threshold, cooldownMs }) {
  function transition(operation, ticket = '', outcome = '') {
    return redis?.([
      'EVAL', TRANSITION, 1, KEY, operation, crypto.randomUUID(),
      ticket, outcome, threshold, cooldownMs, PROBE_LEASE_MS,
    ])
  }

  return {
    async acquire() {
      const shared = await transition('acquire')
      if (shared !== undefined) return { ticket: shared, shared: true }
      return { ticket: local.acquire(), shared: false }
    },
    async finish({ ticket, shared }, outcome) {
      if (shared) {
        const result = await transition('finish', ticket, outcome)
        return result ?? 'unknown'
      }
      return local.finish(ticket, outcome)
    },
  }
}
