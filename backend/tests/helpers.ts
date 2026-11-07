import { resolve } from 'node:path'
import { vi } from 'vitest'
import { Document } from '@langchain/core/documents'
import type { BaseRetriever } from '@langchain/core/retrievers'
import { loadConfig, type AppConfig } from '../src/config/env.js'
import { silentLogger } from '../src/shared/logger.js'
import {
  loadRagIndex,
  type RagIndex,
} from '../src/modules/rag/index-loader.js'
import { JsonVectorStore } from '../src/modules/rag/json-vector-store.js'
import type { EmbeddingsClient } from '../src/modules/embeddings/types.js'
import type {
  LlmClient,
  LlmGenerateResult,
} from '../src/modules/llm/types.js'
import {
  ChatService,
  type ChatServiceDependencies,
} from '../src/modules/chat/chat.service.js'
import {
  TtlCache,
  type CachedAnswer,
  type CachedFailure,
} from '../src/modules/chat/answer-cache.js'
import { createApp } from '../src/app.js'

export const repoRoot = resolve(process.cwd(), '..')

export function testEnv(
  overrides: Record<string, string | undefined> = {},
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    PORT: '3201',
    LOG_LEVEL: 'silent',
    RATE_LIMIT_ENABLED: 'false',
    RAG_INDEX_PATH: resolve(repoRoot, 'worker/rag/index.json'),
    EMBEDDINGS_PROVIDER: 'none',
    OPENROUTER_MODELS: 'test/model',
    LLM_MODE: 'mock',
    ...overrides,
  }
}

export function testConfig(
  overrides: Record<string, string | undefined> = {},
): AppConfig {
  return loadConfig(testEnv(overrides))
}

export async function loadTestIndex(): Promise<RagIndex> {
  return loadRagIndex(resolve(repoRoot, 'worker/rag/index.json'))
}

export function makeDocument(
  text: string,
  {
    section = 'Stack — Backend e linguagens',
    source = 'knowledge/rag/02-stack.md',
    score = 0.91,
    id = 'test-chunk',
  }: {
    section?: string
    source?: string
    score?: number
    id?: string
  } = {},
): Document {
  return new Document({
    pageContent: text,
    metadata: { id, section, source, score },
  })
}

export function fakeEmbeddings(
  vector: number[],
  configured = true,
): EmbeddingsClient {
  return {
    model: 'test-bge-m3',
    dimensions: vector.length,
    isConfigured: () => configured,
    embedQuery: vi.fn(async () => vector),
    embedDocuments: vi.fn(async (texts: string[]) =>
      texts.map(() => vector),
    ),
  } as unknown as EmbeddingsClient
}

export function fakeRetriever(documents: Document[]): BaseRetriever {
  return {
    invoke: vi.fn(async () => documents),
  } as unknown as BaseRetriever
}

export function fakeLlm({
  result,
  error,
  configured = true,
}: {
  result?: LlmGenerateResult
  error?: unknown
  configured?: boolean
} = {}): LlmClient {
  return {
    mode: 'mock',
    isConfigured: () => configured,
    generate: vi.fn(async () => {
      if (error) throw error
      return (
        result ?? {
          text: 'Resposta de teste fundamentada [1]',
          provider: 'test',
          model: 'test-model',
          stage: 'test',
          attempts: [],
          generationMs: 1,
        }
      )
    }),
  }
}

export interface TestContext {
  config: AppConfig
  index: RagIndex
  store: JsonVectorStore
  embeddings: EmbeddingsClient
  retriever: BaseRetriever
  llm: LlmClient
  service: ChatService
  app: ReturnType<typeof createApp>
}

export async function createTestContext({
  configOverrides = {},
  index,
  embeddings,
  retriever,
  llm,
}: {
  configOverrides?: Record<string, string | undefined>
  index?: RagIndex
  embeddings?: EmbeddingsClient
  retriever?: BaseRetriever
  llm?: LlmClient
} = {}): Promise<TestContext> {
  const config = testConfig(configOverrides)
  const ragIndex = index ?? (await loadTestIndex())
  const store = new JsonVectorStore(ragIndex, config)
  const queryVector =
    ragIndex.chunks.find((chunk) =>
      chunk.section.toLowerCase().includes('backend'),
    )?.vector ?? ragIndex.chunks[0]?.vector ?? [0]
  const embeddingsClient = embeddings ?? fakeEmbeddings(queryVector)
  const retrieverClient =
    retriever ??
    fakeRetriever([
      makeDocument(
        'Node.js, TypeScript, Express e NestJS aparecem na ficha profissional.',
      ),
    ])
  const llmClient = llm ?? fakeLlm()

  const dependencies: ChatServiceDependencies = {
    config,
    logger: silentLogger(),
    embeddings: embeddingsClient,
    retriever: retrieverClient,
    llm: llmClient,
    store,
    answerCache: new TtlCache<CachedAnswer>(100),
    negativeCache: new TtlCache<CachedFailure>(100),
  }

  const service = new ChatService(dependencies)
  const app = createApp({
    config,
    logger: silentLogger(),
    chatService: service,
    store,
    embeddings: embeddingsClient,
    llm: llmClient,
    startedAt: Date.now(),
  })

  return {
    config,
    index: ragIndex,
    store,
    embeddings: embeddingsClient,
    retriever: retrieverClient,
    llm: llmClient,
    service,
    app,
  }
}
