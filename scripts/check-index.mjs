#!/usr/bin/env node
import {
  INDEX_PATH,
  buildChunks,
  fileSize,
  formatBytes,
  loadEmbeddingConfig,
  readIndex,
} from './rag-lib.mjs'

async function main() {
  const index = await readIndex()
  const { sourceHash, chunks } = await buildChunks()
  const { model } = await loadEmbeddingConfig()
  const errors = []

  if (index.version !== 1) {
    errors.push(`Versão de índice não suportada: ${index.version} (esperado 1).`)
  }

  if (index.sourceHash !== sourceHash) {
    errors.push(
      `sourceHash do índice (${index.sourceHash}) difere do corpus atual (${sourceHash}).`,
    )
  }

  if (index.chunkCount !== chunks.length) {
    errors.push(`chunkCount do índice (${index.chunkCount}) difere do corpus (${chunks.length}).`)
  }

  if (index.embeddingModel !== model) {
    errors.push(
      `Modelo do índice (${index.embeddingModel}) difere do configurado (${model}). Regenere o índice.`,
    )
  }

  if (!Number.isInteger(index.dimensions) || index.dimensions <= 0) {
    errors.push(`Dimensões inválidas no índice: ${index.dimensions}.`)
  }

  const indexedById = new Map()
  for (const indexed of index.chunks) {
    indexedById.set(indexed.id, indexed)
  }

  const expectedIds = new Set()

  for (const expected of chunks) {
    expectedIds.add(expected.id)
    const indexed = indexedById.get(expected.id)

    if (!indexed) {
      errors.push(`Chunk ausente no índice: ${expected.id}`)
      continue
    }

    if (indexed.hash !== expected.hash) {
      errors.push(`Conteúdo alterado sem reindexação: ${expected.id}`)
    }

    if (indexed.source !== expected.source) {
      errors.push(`Fonte divergente em ${expected.id}: ${indexed.source} != ${expected.source}`)
    }

    if (indexed.section !== expected.section) {
      errors.push(`Seção divergente em ${expected.id}: ${indexed.section} != ${expected.section}`)
    }

    if (!Array.isArray(indexed.vector) || indexed.vector.length !== index.dimensions) {
      errors.push(
        `Vetor inválido em ${expected.id}: ${
          Array.isArray(indexed.vector) ? indexed.vector.length : 'ausente'
        } dimensões.`,
      )
    }

    if (typeof indexed.norm !== 'number' || !Number.isFinite(indexed.norm)) {
      errors.push(`Norma inválida em ${expected.id}.`)
    }
  }

  for (const indexed of index.chunks) {
    if (!expectedIds.has(indexed.id)) {
      errors.push(`Chunk obsoleto no índice: ${indexed.id}`)
    }
  }

  if (errors.length > 0) {
    console.error(`Índice desatualizado em ${INDEX_PATH}:`)
    for (const error of errors) console.error(`  - ${error}`)
    console.error('\nRode: npm run rag:index')
    process.exit(1)
  }

  console.log('Índice consistente com o corpus.')
  console.log(`Arquivo: ${INDEX_PATH} (${formatBytes(await fileSize(INDEX_PATH))})`)
  console.log(
    `Chunks: ${index.chunkCount} | Modelo: ${index.embeddingModel} | Dimensões: ${index.dimensions}`,
  )
  console.log(`sourceHash: ${index.sourceHash}`)
}

try {
  await main()
} catch (error) {
  console.error(`\nErro: ${error.message}`)
  process.exit(1)
}
