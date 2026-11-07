import type { Embeddings } from '@langchain/core/embeddings'

export type EmbeddingsClient = Embeddings & {
  readonly model: string
  readonly dimensions: number
  isConfigured(): boolean
}
