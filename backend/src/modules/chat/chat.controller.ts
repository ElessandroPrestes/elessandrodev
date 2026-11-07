import type { NextFunction, Request, Response } from 'express'
import type { AppConfig } from '../../config/env.js'
import { ValidationError } from '../../shared/errors.js'
import {
  createChatRequestSchema,
  validationMessage,
  type ChatRequest,
} from './chat.schema.js'
import type { ChatService } from './chat.service.js'

function localeOf(req: Request): 'pt' | 'en' {
  return (req.body as { locale?: unknown } | undefined)?.locale === 'en'
    ? 'en'
    : 'pt'
}

export function createChatController(
  config: AppConfig,
  service: ChatService,
) {
  const schema = createChatRequestSchema(config)

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const parsed = schema.safeParse(req.body)

    if (!parsed.success) {
      next(
        new ValidationError(
          validationMessage(parsed.error, localeOf(req)),
          { issues: parsed.error.issues.map((issue) => issue.path.join('.')) },
        ),
      )
      return
    }

    const { question, locale } = parsed.data as ChatRequest
    const controller = new AbortController()
    const onClose = () => {
      if (!res.writableEnded) controller.abort()
    }
    req.on('close', onClose)

    try {
      const result = await service.answer({
        question,
        locale,
        requestId: req.id,
        signal: controller.signal,
      })

      res.setHeader('X-Assistant-Cache', result.cache)
      if (result.provider) {
        res.setHeader('X-Assistant-Provider', result.provider)
      }
      res.setHeader('X-Assistant-Stage', result.stage)
      res.status(200).json({
        response: result.response,
        sources: result.sources,
      })
    } catch (error) {
      next(error)
    } finally {
      req.off('close', onClose)
    }
  }
}
