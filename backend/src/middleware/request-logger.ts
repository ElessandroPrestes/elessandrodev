import type { Logger } from 'pino'
import type { NextFunction, Request, Response } from 'express'

export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint()
    req.log = logger.child({ requestId: req.id })

    res.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000
      req.log.info(
        {
          method: req.method,
          path: req.originalUrl.split('?')[0],
          status: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
          ip: req.ip,
        },
        'request completed',
      )
    })

    next()
  }
}
