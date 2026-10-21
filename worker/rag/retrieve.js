import { hybridScores, tokenize } from '../../shared/retrieval.js'

export function extractEmbedding(result) {
  let data = result?.data ?? result?.response ?? result

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
    data = [data]
  }

  if (!Array.isArray(data) || !Array.isArray(data[0]) || data[0].length === 0) {
    throw new Error('Resposta de embedding inválida.')
  }

  return data[0]
}

export async function embedQuestion(ai, model, question) {
  const result = await ai.run(model, { text: [question] })
  return extractEmbedding(result)
}

export function retrieveChunks({
  queryVector,
  question,
  chunks,
  topK = 4,
  alpha = 0.6,
  minScore = 0.45,
}) {
  const scored = hybridScores({
    queryVector,
    queryTokens: tokenize(question),
    chunks,
    alpha,
  }).sort((a, b) => b.score - a.score)

  return scored.filter((item) => item.score >= minScore).slice(0, topK)
}

export function formatSources(retrieved) {
  return retrieved.map(({ chunk, score }) => ({
    section: chunk.section,
    source: chunk.source,
    score: Number(score.toFixed(3)),
  }))
}

export function buildContext(retrieved) {
  return retrieved
    .map(
      ({ chunk }, index) =>
        `[${index + 1}] Seção: ${chunk.section} (fonte: ${chunk.source})\n${chunk.text}`,
    )
    .join('\n\n---\n\n')
}
