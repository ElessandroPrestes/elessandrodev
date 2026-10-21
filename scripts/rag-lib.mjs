import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

export { cosine, tokenize, bm25Scores, hybridScores } from '../shared/retrieval.js'

export const RAG_DIR = 'knowledge/rag'
export const INDEX_PATH = 'worker/rag/index.json'
export const DEFAULT_EMBEDDING_MODEL = '@cf/baai/bge-m3'
export const DEFAULT_TOP_K = 4
export const DEFAULT_HYBRID_ALPHA = 0.6
export const DEFAULT_MIN_SCORE = 0.45

export function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export async function loadEnvFile(file) {
  let text
  try {
    text = await readFile(file, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue

    let value = rawValue
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }

  return true
}

export async function loadEmbeddingConfig() {
  await loadEnvFile('.env.ingest')

  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || '',
    model: process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
  }
}

export function assertEmbeddingConfig({ accountId, apiToken }) {
  if (accountId && apiToken) return
  throw new Error(
    'Credenciais ausentes. Crie .env.ingest a partir de .env.ingest.example e defina ' +
      'CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN.',
  )
}

export async function readCorpus() {
  let entries
  try {
    entries = await readdir(RAG_DIR, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Diretório de corpus não encontrado: ${RAG_DIR}`)
    }
    throw error
  }

  const names = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort()

  if (names.length === 0) {
    throw new Error(`Nenhum arquivo .md encontrado em ${RAG_DIR}`)
  }

  const files = []
  for (const name of names) {
    const relativePath = path.posix.join(RAG_DIR, name)
    const text = await readFile(relativePath, 'utf8')
    if (!text.trim()) {
      throw new Error(`Arquivo de corpus vazio: ${relativePath}`)
    }
    files.push({ name, path: relativePath, text })
  }

  const sourceHash = sha256(
    files.map((file) => `${file.path}\n${file.text}`).join('\n---\n'),
  )

  return { files, sourceHash }
}

export function parseSections(file) {
  const lines = file.text.replace(/\r\n?/g, '\n').split('\n')
  const sections = []
  let current = null

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (current) sections.push(current)
      current = {
        heading: line.replace(/^##\s+/, '').trim(),
        lines: [],
      }
      continue
    }

    if (/^#\s+/.test(line) && !current) continue
    if (current) current.lines.push(line)
  }

  if (current) sections.push(current)

  const normalized = sections
    .map((section) => ({
      heading: section.heading,
      body: section.lines.join('\n').trim(),
    }))
    .filter((section) => section.heading && section.body)

  if (normalized.length === 0) {
    throw new Error(`Nenhuma seção "##" com conteúdo em ${file.path}`)
  }

  return normalized
}

export function chunkText(text, maxChars = 1600, overlapChars = 200) {
  const normalized = String(text ?? '').replace(/\r\n?/g, '\n').trim()
  if (!normalized) return []
  if (normalized.length <= maxChars) return [normalized]

  const chunks = []
  let start = 0

  while (start < normalized.length) {
    let end = Math.min(start + maxChars, normalized.length)

    if (end < normalized.length) {
      const window = normalized.slice(start, end)
      const candidates = [
        window.lastIndexOf('\n\n'),
        window.lastIndexOf('. '),
        window.lastIndexOf('\n'),
      ].filter((index) => index > maxChars * 0.5)

      if (candidates.length > 0) {
        const cut = Math.max(...candidates)
        const separatorLength = window.startsWith('\n\n', cut) ? 2 : 1
        end = start + cut + separatorLength
      }
    }

    const chunk = normalized.slice(start, end).trim()
    if (chunk) chunks.push(chunk)
    if (end >= normalized.length) break

    let nextStart = end - overlapChars
    if (nextStart <= start) nextStart = end
    while (nextStart < end && /\S/.test(normalized[nextStart])) nextStart += 1

    start = nextStart
  }

  return chunks
}

export async function buildChunks() {
  const { files, sourceHash } = await readCorpus()
  const chunks = []
  let sectionCount = 0

  for (const file of files) {
    const sections = parseSections(file)
    const fileSlug = slugify(file.name.replace(/\.md$/i, ''))
    sectionCount += sections.length

    for (const section of sections) {
      const parts = chunkText(section.body)

      parts.forEach((part, index) => {
        const text = `## ${section.heading}\n\n${part}`.trim()
        chunks.push({
          id: `${fileSlug}__${slugify(section.heading)}__${index + 1}`,
          source: file.path,
          section: section.heading,
          text,
          hash: sha256(text),
        })
      })
    }
  }

  if (chunks.length === 0) {
    throw new Error('O corpus não gerou nenhum chunk.')
  }

  const ids = new Set()
  for (const chunk of chunks) {
    if (ids.has(chunk.id)) {
      throw new Error(`ID de chunk duplicado: ${chunk.id}`)
    }
    ids.add(chunk.id)
  }

  return { sourceHash, chunks, fileCount: files.length, sectionCount }
}

function extractVectors(payload, expectedCount) {
  let data =
    payload?.result?.data ??
    payload?.result?.response ??
    payload?.data ??
    payload?.result

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
    data = [data]
  }

  if (!Array.isArray(data) || data.length !== expectedCount) {
    const received = Array.isArray(data) ? data.length : typeof data
    throw new Error(
      `Resposta de embeddings inesperada: esperados ${expectedCount}, recebidos ${received}.`,
    )
  }

  for (const vector of data) {
    if (
      !Array.isArray(vector) ||
      vector.length === 0 ||
      !vector.every((value) => typeof value === 'number' && Number.isFinite(value))
    ) {
      throw new Error('A API retornou um vetor de embedding inválido.')
    }
  }

  return data
}

export async function embedTexts(
  texts,
  { model = DEFAULT_EMBEDDING_MODEL, accountId, apiToken, batchSize = 32 } = {},
) {
  assertEmbeddingConfig({ accountId, apiToken })
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Nenhum texto para gerar embeddings.')
  }

  const safeBatchSize = Math.min(Math.max(Number(batchSize) || 32, 1), 100)
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`
  const vectors = []

  for (let index = 0; index < texts.length; index += safeBatchSize) {
    const batch = texts.slice(index, index + safeBatchSize)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: batch }),
    })

    const raw = await response.text()
    if (!response.ok) {
      throw new Error(
        `Cloudflare Workers AI respondeu ${response.status}: ${raw.slice(0, 500)}`,
      )
    }

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      throw new Error(`Resposta não JSON do Workers AI: ${raw.slice(0, 200)}`)
    }

    if (payload?.success === false) {
      throw new Error(
        `Workers AI retornou erro: ${JSON.stringify(payload.errors ?? payload).slice(0, 500)}`,
      )
    }

    vectors.push(...extractVectors(payload, batch.length))
    process.stdout.write(`  embeddings ${Math.min(index + batch.length, texts.length)}/${texts.length}\r`)
  }

  process.stdout.write('\n')
  return vectors
}

export async function readIndex(indexPath = INDEX_PATH) {
  let raw
  try {
    raw = await readFile(indexPath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Índice não encontrado em ${indexPath}. Rode: npm run rag:index`)
    }
    throw error
  }

  let index
  try {
    index = JSON.parse(raw)
  } catch {
    throw new Error(`Índice inválido (JSON malformado): ${indexPath}`)
  }

  if (!Array.isArray(index.chunks) || index.chunks.length === 0) {
    throw new Error(`Índice sem chunks: ${indexPath}`)
  }

  return index
}

export async function fileSize(filePath) {
  try {
    const info = await stat(filePath)
    return info.size
  } catch {
    return 0
  }
}
