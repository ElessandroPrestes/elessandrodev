import { resolve } from 'node:path'
import {
  loadMarkdownDocuments,
  splitCorpusDocuments,
} from '../src/modules/documents/loader.js'

const directory = resolve(process.cwd(), '../knowledge/rag')

const documents = await loadMarkdownDocuments(directory)
const chunks = await splitCorpusDocuments(documents)

console.log('LangChain document loader + RecursiveCharacterTextSplitter')
console.log(`Diretório: ${directory}`)
console.log(`Documentos: ${documents.length}`)
console.log(`Chunks: ${chunks.length}`)
console.log('Nenhum embedding foi gerado e nenhum índice foi alterado.')
