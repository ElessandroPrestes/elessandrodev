import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import type { Logger } from 'pino'
import { requestId } from './middleware/request-id.js'
import { requestLogger } from './middleware/request-logger.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { createCorsOptions } from './security/cors.js'
import { createChatRouter } from './modules/chat/chat.routes.js'
import type { ChatService } from './modules/chat/chat.service.js'
import {
  createHealthRouter,
  type HealthDependencies,
} from './modules/health/health.routes.js'

export interface AppDependencies extends HealthDependencies {
  logger: Logger
  chatService: ChatService
}

export function createApp(deps: AppDependencies): Express {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', deps.config.trustProxy)
  app.set('json escape', true)

  app.use(requestId)
  app.use(requestLogger(deps.logger))
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.use(cors(createCorsOptions(deps.config)))
  app.use(express.json({ limit: deps.config.requestBodyLimit, strict: true }))

  app.use(createHealthRouter(deps))
  app.use(createChatRouter(deps.config, deps.chatService))

  app.use(notFound)
  app.use(errorHandler)

  return app
}
