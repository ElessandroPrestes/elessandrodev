import { z } from 'zod'
import type { AppConfig } from '../../config/env.js'

export type ChatRequest = {
  question: string
  locale: 'pt' | 'en'
}

export function createChatRequestSchema(config: AppConfig) {
  return z
    .object({
      question: z.string().trim().min(1).max(config.questionMaxLength),
      locale: z.enum(['pt', 'en']).optional().default('pt'),
    })
    .strict()
}

export function validationMessage(
  error: z.ZodError,
  locale: 'pt' | 'en',
): string {
  const fields = new Set(error.issues.map((issue) => issue.path[0]))

  if (fields.has('question')) {
    const tooLong = error.issues.some(
      (issue) =>
        issue.path[0] === 'question' &&
        issue.code === 'too_big',
    )
    if (tooLong) {
      return locale === 'en' ? 'The question is too long.' : 'Pergunta muito longa.'
    }
    return locale === 'en' ? 'Question is required.' : 'Pergunta obrigatória.'
  }

  if (fields.has('locale')) {
    return locale === 'en'
      ? 'Invalid locale. Use "pt" or "en".'
      : 'Idioma inválido. Use "pt" ou "en".'
  }

  return locale === 'en' ? 'Invalid request.' : 'Requisição inválida.'
}
