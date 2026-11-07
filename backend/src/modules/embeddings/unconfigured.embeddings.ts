import { Embeddings } from '@langchain/core/embeddings'
import type { AppConfig } from '../../config/env.js'
import { ConfigurationError } from '../../shared/errors.js'
import type { EmbeddingsClient } from './types.js'

export class UnconfiguredEmbeddings
  extends Embeddings
  implements EmbeddingsClient
{
  readonly model: string
  readonly dimensions: number

  constructor(config: AppConfig) {
    super({})
    this.model = config.embeddings.model
    this.dimensions = config.embeddings.dimensions
  }

  isConfigured(): boolean {
    return false
  }

  async embedDocuments(): Promise<number[][]> {
    throw new ConfigurationError(
      'Nenhum provedor de embeddings configurado. Defina credenciais do Cloudflare Workers AI ou EMBEDDINGS_BASE_URL.',
      'embedding',
    )
  }

  async embedQuery(): Promise<number[]> {
    throw new ConfigurationError(
      'Nenhum provedor de embeddings configurado. Defina credenciais do Cloudflare Workers AI ou EMBEDDINGS_BASE_URL.',
      'embedding',
    )
  }
}
