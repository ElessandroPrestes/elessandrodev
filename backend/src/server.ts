import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'node:http'
import { loadConfig } from './config/env.js'
import { createLogger } from './shared/logger.js'
import { createCircuitBreaker } from './shared/circuit-breaker.js'
import { loadRagIndex } from './modules/rag/index-loader.js'
import { JsonVectorStore } from './modules/rag/json-vector-store.js'
import { HybridJsonRetriever } from './modules/rag/hybrid-json-retriever.js'
import { createEmbeddingsClient } from './modules/embeddings/factory.js'
import { LangChainOpenRouterClient } from './modules/llm/langchain-openrouter.client.js'
import { MockLlmClient } from './modules/llm/mock.client.js'
import { ChatService } from './modules/chat/chat.service.js'
import {
  TtlCache,
  type CachedAnswer,
  type CachedFailure,
} from './modules/chat/answer-cache.js'
import { createApp } from './app.js'

async function main(): Promise<void> {
  const envFile = resolve(process.cwd(), '.env')
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile)
  }

  const config = loadConfig()
  const logger = createLogger(config)
  const startedAt = Date.now()

  const index = await loadRagIndex(config.rag.indexPath)
  if (index.dimensions !== config.embeddings.dimensions) {
    throw new Error(
      `Dimensões do índice (${index.dimensions}) divergem de EMBEDDINGS_DIMENSIONS (${config.embeddings.dimensions}).`,
    )
  }

  const store = new JsonVectorStore(index, config)
  const embeddings = createEmbeddingsClient(config, logger)
  const retriever = new HybridJsonRetriever(store, embeddings)
  const breaker = createCircuitBreaker({
    threshold: config.llm.circuitBreakerThreshold,
    cooldownMs: config.llm.circuitBreakerMs,
  })
  const llm =
    config.llm.mode === 'mock'
      ? new MockLlmClient()
      : new LangChainOpenRouterClient(config, logger, breaker)

  if (!embeddings.isConfigured()) {
    logger.warn(
      { provider: config.embeddings.provider },
      'embeddings provider not configured; /ready will return 503',
    )
  }
  if (!llm.isConfigured()) {
    logger.warn(
      { mode: config.llm.mode },
      'LLM provider not configured; /ready will return 503',
    )
  }

  const queryModel =
    config.embeddings.provider === 'cloudflare'
      ? config.embeddings.model
      : config.embeddings.openAiCompatibleModel
  if (
    !index.embeddingModel.toLowerCase().includes('bge-m3') ||
    !queryModel.toLowerCase().includes('bge-m3')
  ) {
    logger.warn(
      {
        indexModel: index.embeddingModel,
        queryModel,
      },
      'embedding model differs from the index model; verify vector compatibility',
    )
  }

  const chatService = new ChatService({
    config,
    logger,
    embeddings,
    retriever,
    llm,
    store,
    answerCache: new TtlCache<CachedAnswer>(500),
    negativeCache: new TtlCache<CachedFailure>(500),
  })

  const app = createApp({
    config,
    logger,
    chatService,
    store,
    embeddings,
    llm,
    startedAt,
  })

  const server = createServer(app)
  server.requestTimeout = config.llm.totalBudgetMs + config.embeddings.timeoutMs + 10000
  server.headersTimeout = 10000
  server.keepAliveTimeout = 5000

  server.listen(config.port, config.host, () => {
    logger.info(
      {
        host: config.host,
        port: config.port,
        chunkCount: index.chunkCount,
        sourceHash: index.sourceHash,
        embeddingsProvider: config.embeddings.provider,
        llmMode: config.llm.mode,
      },
      'backend listening',
    )
  })

  let shuttingDown = false
  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    logger.info({ signal }, 'graceful shutdown started')

    const timer = setTimeout(() => {
      logger.error('graceful shutdown timed out; forcing exit')
      process.exit(1)
    }, config.shutdownTimeoutMs)
    timer.unref()

    server.close((error) => {
      clearTimeout(timer)
      if (error) {
        logger.error({ err: error }, 'graceful shutdown failed')
        process.exit(1)
      }
      logger.info('graceful shutdown completed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'uncaught exception')
    process.exit(1)
  })
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'unhandled rejection')
  })
}

main().catch((error) => {
  console.error('Falha ao iniciar o backend:', error)
  process.exit(1)
})
