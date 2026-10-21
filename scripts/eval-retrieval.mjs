#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import {
  DEFAULT_HYBRID_ALPHA,
  DEFAULT_MIN_SCORE,
  DEFAULT_TOP_K,
  embedTexts,
  hybridScores,
  loadEmbeddingConfig,
  readIndex,
  tokenize,
} from './rag-lib.mjs'

const QUESTIONS_PATH = 'knowledge/eval/questions.json'

function readNumber(name, fallback, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} inválido: ${raw}`)
  }
  return value
}

async function main() {
  const index = await readIndex()
  const { accountId, apiToken, model } = await loadEmbeddingConfig()

  if (index.embeddingModel !== model) {
    throw new Error(
      `Modelo do índice (${index.embeddingModel}) difere do configurado (${model}). ` +
        'Regenere o índice antes de avaliar.',
    )
  }

  let questions
  try {
    questions = JSON.parse(await readFile(QUESTIONS_PATH, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Arquivo de avaliação não encontrado: ${QUESTIONS_PATH}`)
    }
    throw new Error(`Falha ao ler ${QUESTIONS_PATH}: ${error.message}`)
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(`${QUESTIONS_PATH} deve conter um array não vazio.`)
  }

  const knownSections = new Set(index.chunks.map((chunk) => chunk.section))
  const warnings = []

  for (const [position, item] of questions.entries()) {
    if (!item || typeof item !== 'object') {
      throw new Error(`Questão ${position + 1} inválida.`)
    }
    if (!item.id || !item.question) {
      throw new Error(`Questão ${position + 1} sem id ou question.`)
    }
    if (!Array.isArray(item.expectedSections) || item.expectedSections.length === 0) {
      throw new Error(`Questão ${item.id} sem expectedSections.`)
    }
    for (const section of item.expectedSections) {
      if (!knownSections.has(section)) {
        warnings.push(`Questão ${item.id}: seção esperada não existe no índice: "${section}"`)
      }
    }
  }

  const topK = Math.floor(readNumber('TOP_K', DEFAULT_TOP_K, { min: 1, max: 20 }))
  const alpha = readNumber('HYBRID_ALPHA', DEFAULT_HYBRID_ALPHA, { min: 0, max: 1 })
  const minScore = readNumber('MIN_SCORE', DEFAULT_MIN_SCORE, { min: -1, max: 1 })
  const target = readNumber('EVAL_TARGET', 0.8, { min: 0, max: 1 })

  console.log('RAG — avaliação de recuperação')
  console.log(
    `Questões: ${questions.length} | topK: ${topK} | alpha: ${alpha} | MIN_SCORE: ${minScore} | alvo hit@${topK}: ${target}`,
  )
  console.log(`Índice: ${index.chunkCount} chunks | modelo: ${index.embeddingModel}`)

  if (warnings.length > 0) {
    console.log('\nAvisos:')
    for (const warning of warnings) console.log(`  - ${warning}`)
  }

  const vectors = await embedTexts(
    questions.map((item) => item.question),
    { model, accountId, apiToken },
  )

  const results = []

  for (const [position, item] of questions.entries()) {
    const expected = new Set(item.expectedSections)
    const scored = hybridScores({
      queryVector: vectors[position],
      queryTokens: tokenize(item.question),
      chunks: index.chunks,
      alpha,
    })
      .map(({ chunk, score, vectorScore, lexicalScore }) => ({
        id: chunk.id,
        section: chunk.section,
        source: chunk.source,
        score,
        vectorScore,
        lexicalScore,
      }))
      .sort((a, b) => b.score - a.score)

    const top = scored.slice(0, topK)
    const hitIndex = top.findIndex((chunk) => expected.has(chunk.section))
    const rank = hitIndex >= 0 ? hitIndex + 1 : 0
    const topScore = top[0]?.score ?? 0

    results.push({
      ...item,
      top,
      rank,
      topScore,
      covered: topScore >= minScore,
    })
  }

  console.log('')

  for (const result of results) {
    const status = result.rank > 0 ? 'PASS' : 'FAIL'
    console.log(`[${status}] ${result.id} — ${result.question}`)
    console.log(
      `       top1=${result.topScore.toFixed(3)} | covered=${result.covered ? 'yes' : 'no'} | rank=${result.rank || '-'}`,
    )

    for (const [position, chunk] of result.top.entries()) {
      const marker = result.expectedSections.includes(chunk.section) ? '*' : ' '
      console.log(
        `   ${marker}${position + 1}. ${chunk.score.toFixed(3)} (v ${chunk.vectorScore.toFixed(3)} / l ${chunk.lexicalScore.toFixed(3)})  ${chunk.section}  (${chunk.source})`,
      )
    }
  }

  const hits = results.filter((result) => result.rank > 0).length
  const covered = results.filter((result) => result.covered).length
  const hitRate = hits / results.length
  const coveredRate = covered / results.length
  const mrr =
    results.reduce((sum, result) => sum + (result.rank > 0 ? 1 / result.rank : 0), 0) /
    results.length

  console.log('\nResumo:')
  console.log(`  hit@${topK}: ${(hitRate * 100).toFixed(1)}% (${hits}/${results.length})`)
  console.log(`  MRR: ${mrr.toFixed(3)}`)
  console.log(
    `  cobertura do threshold: ${(coveredRate * 100).toFixed(1)}% (${covered}/${results.length})`,
  )

  if (hitRate + 1e-9 < target) {
    console.error(
      `\nFalha: hit@${topK} ${(hitRate * 100).toFixed(1)}% abaixo do alvo ${(target * 100).toFixed(1)}%.`,
    )
    process.exit(1)
  }

  if (coveredRate + 1e-9 < target) {
    console.log(
      `\nAtenção: ${(target * 100).toFixed(1)}% das perguntas devem ter top1 >= ${minScore} ` +
        'para não cair no fallback. Calibre MIN_SCORE ou melhore o corpus.',
    )
  }
}

try {
  await main()
} catch (error) {
  console.error(`\nErro: ${error.message}`)
  process.exit(1)
}
