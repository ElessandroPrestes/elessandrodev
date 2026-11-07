import { Router } from 'express'
import type { AppConfig } from '../../config/env.js'
import type { EmbeddingsClient } from '../embeddings/types.js'
import type { LlmClient } from '../llm/types.js'
import type { JsonVectorStore } from '../rag/json-vector-store.js'

export interface HealthDependencies {
  config: AppConfig
  store: JsonVectorStore
  embeddings: EmbeddingsClient
  llm: LlmClient
  startedAt: number
}

export function createHealthRouter(deps: HealthDependencies): Router {
  const router = Router()

  router.get('/health', (_req, res) => {
    const metadata = deps.store.metadata
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({
      status: 'ok',
      version: deps.config.appVersion,
      uptimeSeconds: Math.round((Date.now() - deps.startedAt) / 1000),
      chunkCount: metadata.chunkCount,
      sourceHash: metadata.sourceHash,
    })
  })

  router.head('/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).end()
  })

  router.get('/ready', (_req, res) => {
    const metadata = deps.store.metadata
    const checks = {
      index: deps.store.isReady(),
      embeddings: deps.embeddings.isConfigured(),
      llm: deps.llm.isConfigured() || deps.llm.mode === 'mock',
    }
    const ready = Object.values(checks).every(Boolean)

    res.setHeader('Cache-Control', 'no-store')
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not-ready',
      version: deps.config.appVersion,
      checks,
      rag: metadata,
      embeddingsProvider: deps.config.embeddings.provider,
      embeddingModel: deps.embeddings.model,
      llmMode: deps.llm.mode,
    })
  })

  return router
}
