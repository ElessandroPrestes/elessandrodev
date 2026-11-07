export interface PublicErrorBody {
  error: string
  requestId?: string
}

export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly expose: boolean
  readonly stage?: string
  readonly retryAfter?: number
  readonly details?: Record<string, unknown>

  constructor(
    message: string,
    {
      status = 500,
      code = 'INTERNAL_ERROR',
      expose = status < 500,
      stage,
      retryAfter,
      details,
      cause,
    }: {
      status?: number
      code?: string
      expose?: boolean
      stage?: string
      retryAfter?: number
      details?: Record<string, unknown>
      cause?: unknown
    } = {},
  ) {
    super(message, { cause })
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.expose = expose
    this.stage = stage
    this.retryAfter = retryAfter
    this.details = details
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { status: 400, code: 'VALIDATION_ERROR', expose: true, details })
    this.name = 'ValidationError'
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, stage = 'configuration') {
    super(message, {
      status: 503,
      code: 'CONFIGURATION_ERROR',
      expose: false,
      stage,
    })
    this.name = 'ConfigurationError'
  }
}

export class ProviderUnavailableError extends AppError {
  constructor(
    message: string,
    {
      stage,
      status = 503,
      code = 'PROVIDER_UNAVAILABLE',
      retryAfter,
      details,
      cause,
    }: {
      stage?: string
      status?: number
      code?: string
      retryAfter?: number
      details?: Record<string, unknown>
      cause?: unknown
    } = {},
  ) {
    super(message, {
      status,
      code,
      expose: false,
      stage,
      retryAfter,
      details,
      cause,
    })
    this.name = 'ProviderUnavailableError'
  }
}

export class RateLimitedError extends AppError {
  constructor(message: string, retryAfter = 3600, stage = 'rate-limit') {
    super(message, {
      status: 429,
      code: 'RATE_LIMITED',
      expose: true,
      stage,
      retryAfter,
    })
    this.name = 'RateLimitedError'
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'A operação excedeu o tempo limite.', stage = 'timeout') {
    super(message, { status: 504, code: 'TIMEOUT', expose: false, stage })
    this.name = 'TimeoutError'
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'TimeoutError')
  )
}

export function statusFromUnknown(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const candidate = error as {
    status?: unknown
    statusCode?: unknown
    response?: { status?: unknown }
    cause?: { status?: unknown }
  }

  const values = [
    candidate.status,
    candidate.statusCode,
    candidate.response?.status,
    candidate.cause?.status,
  ]

  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }

  return undefined
}
