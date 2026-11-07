import pino, { type Logger } from 'pino'
import type { AppConfig } from '../config/env.js'

export function createLogger(config: AppConfig): Logger {
  return pino({
    level: config.logLevel,
    base: {
      service: 'elessandrodev-backend',
      env: config.nodeEnv,
      version: config.appVersion,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.apiKey',
        '*.api_key',
        '*.token',
        '*.authorization',
      ],
      censor: '[redacted]',
    },
  })
}

export function silentLogger(): Logger {
  return pino({ level: 'silent' })
}
