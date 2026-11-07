import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { Document } from '@langchain/core/documents'
import { loadRagIndex } from '../src/modules/rag/index-loader.js'
import { JsonVectorStore } from '../src/modules/rag/json-vector-store.js'
import { HybridJsonRetriever } from '../src/modules/rag/hybrid-json-retriever.js'
import {
  buildRetrievedContext,
  formatSources,
} from '../src/modules/rag/context.js'
import {
  fakeEmbeddings,
  loadTestIndex,
  repoRoot,
  testConfig,
} from './helpers.js'

describe('RAG com índice existente', () => {
  it('carrega o índice BGE-M3 sem regenerar embeddings', async () => {
    const index = await loadTestIndex()

    expect(index.version).toBe(1)
    expect(index.embeddingModel).toBe('@cf/baai/bge-m3')
    expect(index.dimensions).toBe(1024)
    expect(index.chunks).toHaveLength(36)
    expect(index.chunks.every((chunk) => chunk.vector.length === 1024)).toBe(
      true,
    )
  })

  it('recupera o chunk correspondente ao vetor de consulta', async () => {
    const config = testConfig()
    const index = await loadTestIndex()
    const store = new JsonVectorStore(index, config)
    const target =
      index.chunks.find((chunk) =>
        chunk.section.toLowerCase().includes('backend'),
      ) ?? index.chunks[0]

    const results = store.hybridSearch({
      queryVector: target.vector,
      question: 'Quais tecnologias de backend Elessandro domina?',
      topK: 4,
      alpha: 0.6,
      minScore: 0.45,
    })

    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.chunk.id).toBe(target.id)
    expect(results[0]?.score).toBeGreaterThanOrEqual(0.45)
  })

  it('rejeita vetor com dimensão incompatível', async () => {
    const config = testConfig()
    const index = await loadTestIndex()
    const store = new JsonVectorStore(index, config)

    expect(() =>
      store.hybridSearch({
        queryVector: Array(10).fill(0),
        question: 'teste',
      }),
    ).toThrow(/Dimensões/)
  })

  it('expõe Document do LangChain com metadados e fontes', async () => {
    const config = testConfig()
    const index = await loadTestIndex()
    const store = new JsonVectorStore(index, config)
    const target =
      index.chunks.find((chunk) =>
        chunk.section.toLowerCase().includes('backend'),
      ) ?? index.chunks[0]
    const retriever = new HybridJsonRetriever(
      store,
      fakeEmbeddings(target.vector),
    )

    const documents = await retriever.invoke(
      'Quais tecnologias de backend Elessandro domina?',
    )

    expect(documents.length).toBeGreaterThan(0)
    expect(documents[0]).toBeInstanceOf(Document)
    expect(documents[0]?.metadata.section).toBeTruthy()
    expect(documents[0]?.metadata.source).toBeTruthy()

    const sources = formatSources(documents)
    expect(sources[0]).toEqual({
      section: expect.any(String),
      source: expect.any(String),
      score: expect.any(Number),
    })

    const context = buildRetrievedContext(documents)
    expect(context).toContain('[1] Seção:')
    expect(context).toContain('fonte:')
  })

  it('falha de forma explícita quando o índice não existe', async () => {
    await expect(
      loadRagIndex(resolve(repoRoot, 'worker/rag/missing.json')),
    ).rejects.toThrow(/não encontrado/)
  })
})
