export interface LlmAttempt {
  provider: string
  model: string
  status: number
  durationMs: number
  ok: boolean
  skipped?: 'circuit-open' | 'budget'
}

export interface LlmGenerateInput {
  system: string
  user: string
  signal?: AbortSignal
  deadline?: number
}

export interface LlmGenerateResult {
  text: string
  provider: string
  model: string
  stage: string
  attempts: LlmAttempt[]
  generationMs: number
}

export interface LlmClient {
  readonly mode: 'openrouter' | 'mock'
  isConfigured(): boolean
  generate(input: LlmGenerateInput): Promise<LlmGenerateResult>
}
