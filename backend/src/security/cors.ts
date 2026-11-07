import type { CorsOptions } from 'cors'
import type { AppConfig } from '../config/env.js'
import { AppError } from '../shared/errors.js'

export function createCorsOptions(config: AppConfig): CorsOptions {
  const allowed = new Set(config.corsOrigins)

  return {
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) {
        callback(null, true)
        return
      }
      callback(
        new AppError('Origem não permitida.', {
          status: 403,
          code: 'CORS_FORBIDDEN',
          expose: true,
        }),
      )
    },
    methods: ['POST', 'GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-Id'],
    exposedHeaders: [
      'X-Request-Id',
      'X-Assistant-Cache',
      'X-Assistant-Provider',
      'X-Assistant-Stage',
      'Retry-After',
    ],
    credentials: false,
    maxAge: 86400,
  }
}
