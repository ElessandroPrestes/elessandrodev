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

interface EmbeddingResponse {
  data?: Array<{ embedding?: unknown }>
}

export class OpenAiCompatibleEmbeddings
  extends Embeddings
  implements EmbeddingsClient
{
  readonly model: string
  readonly dimensions: number

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {
    super({})
    this.model = config.embeddings.openAiCompatibleModel
    this.dimensions = config.embeddings.dimensions
  }

  isConfigured(): boolean {
    return Boolean(this.config.embeddings.baseUrl)
  }

  private endpoint(): string {
    return `${this.config.embeddings.baseUrl.replace(/\/+$/, '')}/embeddings`
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!this.isConfigured()) {
      throw new ConfigurationError(
        'EMBEDDINGS_BASE_URL não configurada.',
        'embedding',
      )
    }
    if (!Array.isArray(texts) || texts.length === 0) return []

    return retryWithBackoff(
      async () => {
        const signal = timeoutSignal(this.config.embeddings.timeoutMs)
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (this.config.embeddings.apiKey) {
          headers.Authorization = `Bearer ${this.config.embeddings.apiKey}`
        }

        const response = await fetch(this.endpoint(), {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: this.model, input: texts }),
          signal,
        })

        const raw = await response.text()
        if (!response.ok) {
          this.logger.warn(
            { status: response.status, provider: 'openai-compatible' },
            'embeddings request failed',
          )
          throw new ProviderUnavailableError(
            `Endpoint de embeddings respondeu ${response.status}.`,
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

        let payload: EmbeddingResponse
        try {
          payload = JSON.parse(raw) as EmbeddingResponse
        } catch {
          throw new ProviderUnavailableError(
            'Resposta não JSON do endpoint de embeddings.',
            {
              stage: 'embedding',
              code: 'EMBEDDING_INVALID_RESPONSE',
            },
          )
        }

        if (!Array.isArray(payload.data) || payload.data.length !== texts.length) {
          throw new ProviderUnavailableError(
            'Quantidade de embeddings inesperada.',
            {
              stage: 'embedding',
              code: 'EMBEDDING_INVALID_RESPONSE',
            },
          )
        }

        return payload.data.map((item) => {
          const vector = item.embedding
          if (
            !Array.isArray(vector) ||
            vector.length !== this.dimensions ||
            !vector.every(
              (value) => typeof value === 'number' && Number.isFinite(value),
            )
          ) {
            throw new ProviderUnavailableError(
              'Vetor de embedding com dimensões incompatíveis.',
              {
                stage: 'embedding',
                code: 'EMBEDDING_DIMENSION_MISMATCH',
                details: { expectedDimensions: this.dimensions },
              },
            )
          }
          return vector
        })
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
              provider: 'openai-compatible',
            },
            'retrying embeddings request',
          )
        },
      },
    )
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
