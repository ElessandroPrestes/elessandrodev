import type { Request, Response } from 'express'

export function notFound(req: Request, res: Response): void {
  const locale = (req.body as { locale?: unknown } | undefined)?.locale === 'en'
    ? 'en'
    : 'pt'

  res.status(404).json({
    error: locale === 'en' ? 'Route not found.' : 'Rota não encontrada.',
    requestId: req.id,
  })
}
