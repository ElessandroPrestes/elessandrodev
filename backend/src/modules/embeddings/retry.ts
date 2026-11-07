import {
  isTransientError,
  isTransientStatus,
} from '../../shared/retry.js'

export function isRetryableEmbeddingError(error: unknown): boolean {
  const candidate = error as {
    code?: unknown
    details?: { upstreamStatus?: unknown }
  }

  if (
    candidate.code === 'EMBEDDING_DIMENSION_MISMATCH' ||
    candidate.code === 'EMBEDDING_INVALID_RESPONSE'
  ) {
    return false
  }

  const upstreamStatus = candidate.details?.upstreamStatus
  if (typeof upstreamStatus === 'number') {
    return isTransientStatus(upstreamStatus)
  }

  return isTransientError(error)
}
