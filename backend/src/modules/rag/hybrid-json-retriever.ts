import { BaseRetriever } from '@langchain/core/retrievers'
import { Document } from '@langchain/core/documents'
import type { EmbeddingsClient } from '../embeddings/types.js'
import type { JsonVectorStore } from './json-vector-store.js'

export class HybridJsonRetriever extends BaseRetriever {
  lc_namespace = ['backend', 'rag', 'HybridJsonRetriever']

  constructor(
    private readonly store: JsonVectorStore,
    private readonly embeddings: EmbeddingsClient,
  ) {
    super()
  }

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    const queryVector = await this.embeddings.embedQuery(query)
    const scored = this.store.hybridSearch({
      queryVector,
      question: query,
    })

    return scored.map(
      ({ chunk, score, vectorScore, lexicalScore }) =>
        new Document({
          pageContent: chunk.text,
          metadata: {
            id: chunk.id,
            section: chunk.section,
            source: chunk.source,
            score: Number(score.toFixed(6)),
            vectorScore: Number(vectorScore.toFixed(6)),
            lexicalScore: Number(lexicalScore.toFixed(6)),
          },
        }),
    )
  }
}
