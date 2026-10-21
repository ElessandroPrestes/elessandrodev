#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import {
  INDEX_PATH,
  buildChunks,
  embedTexts,
  fileSize,
  formatBytes,
  loadEmbeddingConfig,
} from './rag-lib.mjs'

const MAX_CHARS = 1600
const OVERLAP_CHARS = 200

function printHelp() {
  console.log(`Uso: node scripts/build-index.mjs [--dry-run]

Gera ${INDEX_PATH} a partir de knowledge/rag/*.md.

  --dry-run   Valida o corpus e o chunking sem chamar a API nem escrever o índice.
  --help      Exibe esta ajuda.

Credenciais (somente para geração real):
  .env.ingest com CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN.
`)
}

async function main() {
  if (process.argv.includes('--help')) {
    printHelp()
    return
  }

  const dryRun = process.argv.includes('--dry-run')

  console.log('RAG — geração do índice vetorial')
  console.log(`Corpus: knowledge/rag/*.md`)
  console.log(`Chunking: ${MAX_CHARS} caracteres, overlap de ${OVERLAP_CHARS}`)

  const { sourceHash, chunks, fileCount, sectionCount } = await buildChunks()

  const bySource = new Map()
  for (const chunk of chunks) {
    bySource.set(chunk.source, (bySource.get(chunk.source) || 0) + 1)
  }

  const lengths = chunks.map((chunk) => chunk.text.length)

  console.log(`Arquivos: ${fileCount} | Seções: ${sectionCount} | Chunks: ${chunks.length}`)
  for (const [source, count] of [...bySource.entries()].sort()) {
    console.log(`  ${source}: ${count} chunk(s)`)
  }
  console.log(
    `Tamanho dos chunks: min ${Math.min(...lengths)} | max ${Math.max(...lengths)} | média ${Math.round(
      lengths.reduce((sum, length) => sum + length, 0) / lengths.length,
    )}`,
  )
  console.log(`sourceHash: ${sourceHash}`)

  if (dryRun) {
    console.log('\nDry-run concluído. Nenhum embedding foi gerado e nenhum arquivo foi escrito.')
    return
  }

  const { accountId, apiToken, model } = await loadEmbeddingConfig()
  console.log(`Modelo de embeddings: ${model}`)

  const vectors = await embedTexts(
    chunks.map((chunk) => chunk.text),
    { model, accountId, apiToken },
  )

  if (vectors.length !== chunks.length) {
    throw new Error(`Quantidade de vetores (${vectors.length}) difere dos chunks (${chunks.length}).`)
  }

  const dimensions = vectors[0].length
  for (const [index, vector] of vectors.entries()) {
    if (vector.length !== dimensions) {
      throw new Error(
        `Dimensão inconsistente no chunk ${chunks[index].id}: ${vector.length} (esperado ${dimensions}).`,
      )
    }
  }

  const indexedChunks = chunks.map((chunk, index) => {
    const vector = vectors[index].map((value) => Number(value.toFixed(6)))
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))

    return {
      ...chunk,
      norm,
      vector,
    }
  })

  const index = {
    version: 1,
    embeddingModel: model,
    dimensions,
    createdAt: new Date().toISOString(),
    sourceHash,
    sourceFileCount: fileCount,
    chunkCount: indexedChunks.length,
    chunking: {
      maxChars: MAX_CHARS,
      overlapChars: OVERLAP_CHARS,
    },
    chunks: indexedChunks,
  }

  await mkdir('worker/rag', { recursive: true })
  await writeFile(INDEX_PATH, `${JSON.stringify(index)}\n`, 'utf8')

  console.log(`\nÍndice gravado: ${INDEX_PATH}`)
  console.log(`Dimensões: ${dimensions} | Tamanho: ${formatBytes(await fileSize(INDEX_PATH))}`)
}

try {
  await main()
} catch (error) {
  console.error(`\nErro: ${error.message}`)
  process.exit(1)
}
