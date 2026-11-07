import type { AppConfig } from '../../config/env.js'
import { ProviderUnavailableError } from '../../shared/errors.js'
import {
  hybridScores,
  tokenize,
  type RagChunk,
  type ScoredChunk,
} from './hybrid.js'
import type { RagIndex } from './index-loader.js'

export interface HybridSearchInput {
  queryVector: number[]
  question: string
  topK?: number
  alpha?: number
  minScore?: number
}

export class JsonVectorStore {
  readonly chunks: RagChunk[]

  constructor(
    private readonly index: RagIndex,
    private readonly config: AppConfig,
  ) {
    this.chunks = index.chunks
  }

  get metadata(): {
    version: number
    embeddingModel: string
    dimensions: number
    sourceHash: string
    chunkCount: number
  } {
    return {
      version: this.index.version,
      embeddingModel: this.index.embeddingModel,
      dimensions: this.index.dimensions,
      sourceHash: this.index.sourceHash,
      chunkCount: this.index.chunkCount,
    }
  }

  isReady(): boolean {
    return this.chunks.length > 0
  }

  hybridSearch({
    queryVector,
    question,
    topK = this.config.rag.topK,
    alpha = this.config.rag.alpha,
    minScore = this.config.rag.minScore,
  }: HybridSearchInput): ScoredChunk[] {
    if (queryVector.length !== this.index.dimensions) {
      throw new ProviderUnavailableError(
        `Dimensões do embedding (${queryVector.length}) divergem do índice (${this.index.dimensions}).`,
        {
          stage: 'retrieval',
          code: 'EMBEDDING_INDEX_DIMENSION_MISMATCH',
        },
      )
    }

    return hybridScores({
      queryVector,
      queryTokens: tokenize(question),
      chunks: this.chunks,
      alpha,
    })
      .sort((left, right) => right.score - left.score)
      .filter((item) => item.score >= minScore)
      .slice(0, topK)
  }
}
