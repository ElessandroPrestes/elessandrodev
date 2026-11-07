import { describe, expect, it } from 'vitest'
import {
  hybridScores as sharedHybridScores,
  tokenize as sharedTokenize,
} from '../../shared/retrieval.js'
import {
  hybridScores,
  tokenize,
} from '../src/modules/rag/hybrid.js'
import { loadTestIndex } from './helpers.js'

describe('paridade com a recuperação híbrida do Worker', () => {
  it('produz os mesmos tokens e scores do shared/retrieval.js', async () => {
    const index = await loadTestIndex()
    const question = 'Quais métricas e resultados no SIPREC da CAPES?'
    const queryVector = index.chunks[3]?.vector ?? index.chunks[0].vector

    expect(tokenize(question)).toEqual(sharedTokenize(question))

    const local = hybridScores({
      queryVector,
      queryTokens: tokenize(question),
      chunks: index.chunks,
      alpha: 0.6,
    })
    const shared = sharedHybridScores({
      queryVector,
      queryTokens: sharedTokenize(question),
      chunks: index.chunks,
      alpha: 0.6,
    })

    expect(local).toHaveLength(shared.length)
    for (let position = 0; position < local.length; position += 1) {
      expect(local[position]?.score).toBeCloseTo(
        shared[position]?.score ?? 0,
        10,
      )
      expect(local[position]?.vectorScore).toBeCloseTo(
        shared[position]?.vectorScore ?? 0,
        10,
      )
      expect(local[position]?.lexicalScore).toBeCloseTo(
        shared[position]?.lexicalScore ?? 0,
        10,
      )
    }
  })
})
