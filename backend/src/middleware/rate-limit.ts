import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import type { RequestHandler } from 'express'
import type { AppConfig } from '../config/env.js'

function localeOf(req: Parameters<RequestHandler>[0]): 'pt' | 'en' {
  return (req.body as { locale?: unknown } | undefined)?.locale === 'en'
    ? 'en'
    : 'pt'
}

export function createChatRateLimit(config: AppConfig): RequestHandler {
  if (!config.rateLimit.enabled) {
    return (_req, _res, next) => next()
  }

  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.chatMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? 'unknown'),
    handler: (req, res) => {
      const locale = localeOf(req)
      res.setHeader('Retry-After', String(Math.ceil(config.rateLimit.windowMs / 1000)))
      res.setHeader('X-Assistant-Stage', 'rate-limit')
      res.status(429).json({
        error:
          locale === 'en'
            ? 'The assistant reached its usage limit. Please try again later.'
            : 'O assistente atingiu o limite de uso. Tente novamente mais tarde.',
        requestId: req.id,
      })
    },
  })
}
