import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { ConfigurationError } from '../../shared/errors.js'
import type { RagChunk } from './hybrid.js'

const chunkSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  section: z.string().min(1),
  text: z.string().min(1),
  hash: z.string().optional(),
  norm: z.number().optional(),
  vector: z.array(z.number()).min(1),
})

const indexSchema = z.object({
  version: z.number().int(),
  embeddingModel: z.string().min(1),
  dimensions: z.number().int().positive(),
  createdAt: z.string().optional(),
  sourceHash: z.string().min(1),
  sourceFileCount: z.number().int().optional(),
  chunkCount: z.number().int().optional(),
  chunking: z
    .object({
      maxChars: z.number().int().positive(),
      overlapChars: z.number().int().nonnegative(),
    })
    .optional(),
  chunks: z.array(chunkSchema).min(1),
})

export interface RagIndex {
  version: number
  embeddingModel: string
  dimensions: number
  sourceHash: string
  chunks: RagChunk[]
  chunkCount: number
  sourceFileCount?: number
  createdAt?: string
}

export async function loadRagIndex(indexPath: string): Promise<RagIndex> {
  let raw: string
  try {
    raw = await readFile(indexPath, 'utf8')
  } catch (error) {
    throw new ConfigurationError(
      `Índice RAG não encontrado em ${indexPath}: ${(error as Error).message}`,
      'retrieval',
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ConfigurationError(
      `Índice RAG inválido (JSON malformado): ${indexPath}`,
      'retrieval',
    )
  }

  const result = indexSchema.safeParse(parsed)
  if (!result.success) {
    throw new ConfigurationError(
      `Índice RAG inválido: ${result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`,
      'retrieval',
    )
  }

  const index = result.data
  if (index.version !== 1) {
    throw new ConfigurationError(
      `Versão de índice não suportada: ${index.version}.`,
      'retrieval',
    )
  }

  for (const chunk of index.chunks) {
    if (chunk.vector.length !== index.dimensions) {
      throw new ConfigurationError(
        `Chunk ${chunk.id} tem ${chunk.vector.length} dimensões; esperado ${index.dimensions}.`,
        'retrieval',
      )
    }
  }

  return {
    ...index,
    chunkCount: index.chunks.length,
  }
}
