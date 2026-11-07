import { Router, type RequestHandler } from 'express'
import type { AppConfig } from '../../config/env.js'
import { AppError } from '../../shared/errors.js'
import { createChatRateLimit } from '../../middleware/rate-limit.js'
import { createChatController } from './chat.controller.js'
import type { ChatService } from './chat.service.js'

const methodGuard: RequestHandler = (req, res, next) => {
  if (req.method === 'POST') {
    next()
    return
  }

  res.setHeader('Allow', 'POST, OPTIONS')
  next(
    new AppError('Método não permitido.', {
      status: 405,
      code: 'METHOD_NOT_ALLOWED',
      expose: true,
    }),
  )
}

export function createChatRouter(
  config: AppConfig,
  service: ChatService,
): Router {
  const router = Router()
  const rateLimit = createChatRateLimit(config)
  const controller = createChatController(config, service)

  router.all('/api/chat', methodGuard)
  router.post('/api/chat', rateLimit, controller)

  router.all('/chat', methodGuard)
  router.post('/chat', rateLimit, controller)

  return router
}
