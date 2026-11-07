import type { NextFunction, Request, Response } from 'express'
import { AppError, isAbortError, type PublicErrorBody } from '../shared/errors.js'

function localeOf(req: Request): 'pt' | 'en' {
  const bodyLocale = (req.body as { locale?: unknown } | undefined)?.locale
  if (bodyLocale === 'en') return 'en'
  return req.header('accept-language')?.toLowerCase().startsWith('en') ? 'en' : 'pt'
}

function publicMessage(error: AppError, locale: 'pt' | 'en'): string {
  if (error.expose && error.message) return error.message

  const messages = {
    400: {
      pt: 'Requisição inválida.',
      en: 'Invalid request.',
    },
    401: {
      pt: 'Não autorizado.',
      en: 'Unauthorized.',
    },
    403: {
      pt: 'Acesso não permitido.',
      en: 'Access denied.',
    },
    404: {
      pt: 'Rota não encontrada.',
      en: 'Route not found.',
    },
    413: {
      pt: 'Payload muito grande.',
      en: 'Payload too large.',
    },
    429: {
      pt: 'O assistente atingiu o limite de uso. Tente novamente mais tarde.',
      en: 'The assistant reached its usage limit. Please try again later.',
    },
    502: {
      pt: 'O assistente está temporariamente indisponível. Tente novamente em instantes.',
      en: 'The assistant is temporarily unavailable. Please try again shortly.',
    },
    503: {
      pt: 'O assistente está temporariamente indisponível. Tente novamente em instantes.',
      en: 'The assistant is temporarily unavailable. Please try again shortly.',
    },
    504: {
      pt: 'A requisição excedeu o tempo limite. Tente novamente.',
      en: 'The request timed out. Please try again.',
    },
    500: {
      pt: 'Erro interno. Tente novamente mais tarde.',
      en: 'Internal error. Please try again later.',
    },
  } as const

  const byStatus = messages[error.status as keyof typeof messages] ?? messages[500]
  return byStatus[locale]
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error

  if (isAbortError(error)) {
    return new AppError('A requisição foi cancelada.', {
      status: 499,
      code: 'ABORTED',
      expose: false,
    })
  }

  const candidate = error as {
    type?: unknown
    status?: unknown
    statusCode?: unknown
    message?: unknown
  }

  if (candidate?.type === 'entity.too.large') {
    return new AppError('Payload muito grande.', {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      expose: true,
    })
  }

  if (candidate instanceof SyntaxError || candidate?.type === 'entity.parse.failed') {
    return new AppError('JSON inválido.', {
      status: 400,
      code: 'INVALID_JSON',
      expose: true,
    })
  }

  const status =
    typeof candidate?.status === 'number'
      ? candidate.status
      : typeof candidate?.statusCode === 'number'
        ? candidate.statusCode
        : 500

  return new AppError('Erro interno.', {
    status,
    code: 'INTERNAL_ERROR',
    expose: false,
  })
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error)
    return
  }

  const normalized = normalizeError(error)
  const locale = localeOf(req)
  const body: PublicErrorBody = {
    error: publicMessage(normalized, locale),
    requestId: req.id,
  }

  if (normalized.stage) res.setHeader('X-Assistant-Stage', normalized.stage)
  if (normalized.retryAfter) {
    res.setHeader('Retry-After', String(normalized.retryAfter))
  }
  const cacheHeader = normalized.details?.cache
  if (typeof cacheHeader === 'string') {
    res.setHeader('X-Assistant-Cache', cacheHeader)
  }

  req.log?.error(
    {
      err: error,
      status: normalized.status,
      code: normalized.code,
      stage: normalized.stage,
      aborted: isAbortError(error),
    },
    'request failed',
  )

  res.status(normalized.status).json(body)
}
