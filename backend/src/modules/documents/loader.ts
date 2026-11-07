import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

export async function loadMarkdownDocuments(
  directory: string,
): Promise<Document[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort()

  const documents: Document[] = []
  for (const file of files) {
    const source = path.posix.join(directory, file)
    const text = await readFile(source, 'utf8')
    if (!text.trim()) continue
    documents.push(
      new Document({
        pageContent: text,
        metadata: { source },
      }),
    )
  }

  return documents
}

export async function splitCorpusDocuments(
  documents: Document[],
): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1600,
    chunkOverlap: 200,
  })

  return splitter.splitDocuments(documents)
}
