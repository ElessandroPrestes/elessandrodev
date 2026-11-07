import type { Document } from '@langchain/core/documents'

export interface Source {
  section: string
  source: string
  score: number
}

export function buildRetrievedContext(documents: Document[]): string {
  return documents
    .map((document, index) => {
      const section = String(document.metadata.section ?? '')
      const source = String(document.metadata.source ?? '')
      return `[${index + 1}] Seção: ${section} (fonte: ${source})\n${document.pageContent}`
    })
    .join('\n\n---\n\n')
}

export function formatSources(documents: Document[]): Source[] {
  return documents.map((document) => ({
    section: String(document.metadata.section ?? ''),
    source: String(document.metadata.source ?? ''),
    score: Number(Number(document.metadata.score ?? 0).toFixed(3)),
  }))
}
