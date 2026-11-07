import type { Logger } from 'pino'
import type { AppConfig } from '../../config/env.js'
import { CloudflareBgeM3Embeddings } from './cloudflare-bge-m3.embeddings.js'
import { OpenAiCompatibleEmbeddings } from './openai-compatible.embeddings.js'
import type { EmbeddingsClient } from './types.js'
import { UnconfiguredEmbeddings } from './unconfigured.embeddings.js'

export function createEmbeddingsClient(
  config: AppConfig,
  logger: Logger,
): EmbeddingsClient {
  const provider = config.embeddings.provider

  if (provider === 'cloudflare') {
    return new CloudflareBgeM3Embeddings(config, logger)
  }

  if (provider === 'openai-compatible') {
    return new OpenAiCompatibleEmbeddings(config, logger)
  }

  if (provider === 'none') {
    return new UnconfiguredEmbeddings(config)
  }

  if (
    config.embeddings.cloudflareAccountId &&
    config.embeddings.cloudflareApiToken
  ) {
    return new CloudflareBgeM3Embeddings(config, logger)
  }

  if (config.embeddings.baseUrl) {
    return new OpenAiCompatibleEmbeddings(config, logger)
  }

  return new UnconfiguredEmbeddings(config)
}
