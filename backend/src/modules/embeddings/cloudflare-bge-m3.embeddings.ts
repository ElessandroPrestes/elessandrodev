import type { Logger } from 'pino'
import { Embeddings } from '@langchain/core/embeddings'
import type { AppConfig } from '../../config/env.js'
import {
  ConfigurationError,
  ProviderUnavailableError,
} from '../../shared/errors.js'
import { retryWithBackoff } from '../../shared/retry.js'
import { timeoutSignal } from '../../shared/timeout.js'
import { isRetryableEmbeddingError } from './retry.js'
import type { EmbeddingsClient } from './types.js'

function extractVectors(
  payload: unknown,
  expectedCount: number,
  dimensions: number,
): number[][] {
  const record = payload as {
    result?: { data?: unknown; response?: unknown }
    data?: unknown
    response?: unknown
  }
  let data =
    record?.result?.data ??
    record?.result?.response ??
    record?.data ??
    record?.response ??
    payload

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
    data = [data]
  }

  if (!Array.isArray(data) || data.length !== expectedCount) {
    throw new ProviderUnavailableError('Resposta de embeddings inválida.', {
      stage: 'embedding',
      code: 'EMBEDDING_INVALID_RESPONSE',
    })
  }

  return data.map((vector) => {
    if (
      !Array.isArray(vector) ||
      vector.length !== dimensions ||
      !vector.every(
        (value) => typeof value === 'number' && Number.isFinite(value),
      )
    ) {
      throw new ProviderUnavailableError(
        'Vetor de embedding com dimensões incompatíveis.',
        {
          stage: 'embedding',
          code: 'EMBEDDING_DIMENSION_MISMATCH',
          details: { expectedDimensions: dimensions },
        },
      )
    }
    return vector
  })
}

export class CloudflareBgeM3Embeddings
  extends Embeddings
  implements EmbeddingsClient
{
  readonly model: string
  readonly dimensions: number
  private readonly batchSize = 32

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {
    super({})
    this.model = config.embeddings.model
    this.dimensions = config.embeddings.dimensions
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.embeddings.cloudflareAccountId &&
        this.config.embeddings.cloudflareApiToken,
    )
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!this.isConfigured()) {
      throw new ConfigurationError(
        'Credenciais do Cloudflare Workers AI ausentes.',
        'embedding',
      )
    }
    if (!Array.isArray(texts) || texts.length === 0) return []

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.embeddings.cloudflareAccountId}/ai/run/${this.model}`
    const vectors: number[][] = []

    for (let index = 0; index < texts.length; index += this.batchSize) {
      const batch = texts.slice(index, index + this.batchSize)
      const result = await retryWithBackoff(
        async () => {
          const signal = timeoutSignal(this.config.embeddings.timeoutMs)
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.config.embeddings.cloudflareApiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: batch }),
            signal,
          })

          const raw = await response.text()
          if (!response.ok) {
            this.logger.warn(
              { status: response.status, provider: 'cloudflare' },
              'cloudflare embeddings request failed',
            )
            throw new ProviderUnavailableError(
              `Cloudflare Workers AI respondeu ${response.status}.`,
              {
                stage: 'embedding',
                status: response.status >= 500 ? 503 : 502,
                code: 'EMBEDDING_PROVIDER_ERROR',
                details: {
                  status: response.status,
                  upstreamStatus: response.status,
                },
              },
            )
          }

          let payload: unknown
          try {
            payload = JSON.parse(raw)
          } catch {
            throw new ProviderUnavailableError(
              'Resposta não JSON do Cloudflare Workers AI.',
              {
                stage: 'embedding',
                code: 'EMBEDDING_INVALID_RESPONSE',
              },
            )
          }

          const success = (payload as { success?: boolean })?.success
          if (success === false) {
            throw new ProviderUnavailableError(
              'Cloudflare Workers AI retornou erro.',
              {
                stage: 'embedding',
                code: 'EMBEDDING_PROVIDER_ERROR',
              },
            )
          }

          return extractVectors(payload, batch.length, this.dimensions)
        },
        {
          attempts: 3,
          baseMs: 250,
          maxMs: 2000,
          shouldRetry: isRetryableEmbeddingError,
          onRetry: (error, attempt, delayMs) => {
            this.logger.warn(
              {
                attempt,
                delayMs,
                message: (error as Error)?.message,
                provider: 'cloudflare',
              },
              'retrying cloudflare embeddings',
            )
          },
        },
      )

      vectors.push(...result)
    }

    return vectors
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.embedDocuments([text])
    if (!vector) {
      throw new ProviderUnavailableError('Embedding vazio.', {
        stage: 'embedding',
        code: 'EMBEDDING_EMPTY',
      })
    }
    return vector
  }
}
