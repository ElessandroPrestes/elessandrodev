const STOPWORDS = new Set([
  'a', 'ao', 'aos', 'as', 'at', 'by', 'com', 'como', 'da', 'das', 'de', 'do', 'dos',
  'e', 'em', 'entre', 'essa', 'esse', 'esta', 'este', 'eu', 'foi', 'for', 'from',
  'ha', 'has', 'have', 'in', 'is', 'ja', 'mais', 'mas', 'menos', 'muito', 'na',
  'nas', 'no', 'nos', 'o', 'os', 'ou', 'para', 'pela', 'pelo', 'por', 'qual',
  'quais', 'que', 'se', 'sem', 'ser', 'seu', 'sua', 'tem', 'ter', 'the', 'to',
  'um', 'uma', 'was', 'were', 'with', 'what', 'which', 'how', 'why', 'where',
  'when', 'who', 'and', 'or', 'of', 'on', 'an', 'as', 'be', 'been', 'being',
  'do', 'does', 'did', 'has', 'had', 'having', 'it', 'its', 'this', 'that',
  'these', 'those', 'their', 'they', 'you', 'your', 'we', 'our', 'not', 'can',
  'could', 'should', 'would', 'about', 'into', 'over', 'under', 'than', 'then',
  'experiencia', 'experience', 'atuacao', 'atuou', 'atuar', 'trabalhou', 'worked',
  'elessandro', 'quem', 'onde', 'quando', 'porque', 'posso', 'voce', 'voces',
])

export function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function tokenize(text) {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
}

export function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new Error('Vetores inválidos para similaridade de cosseno.')
  }
  if (a.length !== b.length) {
    throw new Error(`Dimensões incompatíveis: ${a.length} e ${b.length}.`)
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function bm25Scores(queryTokens, documents, { k1 = 1.2, b = 0.75 } = {}) {
  const documentTokens = documents.map((document) => tokenize(document))
  const documentCount = documentTokens.length
  const averageLength =
    documentTokens.reduce((sum, tokens) => sum + tokens.length, 0) / documentCount || 1

  const documentFrequency = new Map()
  for (const tokens of documentTokens) {
    for (const term of new Set(tokens)) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1)
    }
  }

  const uniqueQueryTokens = [...new Set(queryTokens)]

  return documentTokens.map((tokens) => {
    const termFrequency = new Map()
    for (const token of tokens) {
      termFrequency.set(token, (termFrequency.get(token) || 0) + 1)
    }

    let score = 0
    for (const term of uniqueQueryTokens) {
      const frequency = termFrequency.get(term) || 0
      if (frequency === 0) continue

      const termDocumentFrequency = documentFrequency.get(term) || 0
      const idf = Math.log(
        1 + (documentCount - termDocumentFrequency + 0.5) / (termDocumentFrequency + 0.5),
      )
      const denominator =
        frequency + k1 * (1 - b + (b * tokens.length) / averageLength)
      score += (idf * frequency * (k1 + 1)) / denominator
    }

    return score
  })
}

export function normalizeScores(scores) {
  const maximum = Math.max(...scores, 0)
  if (maximum <= 0) return scores.map(() => 0)
  return scores.map((score) => score / maximum)
}

export function hybridScores({ queryVector, queryTokens, chunks, alpha = 0.6 }) {
  const lexicalScores = normalizeScores(
    bm25Scores(
      queryTokens,
      chunks.map((chunk) => chunk.text),
    ),
  )
  const effectiveAlpha = queryTokens.length === 0 ? 1 : alpha

  return chunks.map((chunk, index) => {
    const vectorScore = cosine(queryVector, chunk.vector)
    const lexicalScore = lexicalScores[index]

    return {
      chunk,
      vectorScore,
      lexicalScore,
      score: effectiveAlpha * vectorScore + (1 - effectiveAlpha) * lexicalScore,
    }
  })
}
