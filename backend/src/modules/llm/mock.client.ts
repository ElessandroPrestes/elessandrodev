import type { LlmClient, LlmGenerateInput, LlmGenerateResult } from './types.js'

export class MockLlmClient implements LlmClient {
  readonly mode = 'mock' as const

  isConfigured(): boolean {
    return true
  }

  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    const english = input.system.includes('Respond in English')
    return {
      text: english
        ? 'Mock mode is active. No external LLM provider was called. Configure OPENROUTER_API_KEY to generate real answers.'
        : 'O modo mock está ativo. Nenhum provedor externo de LLM foi chamado. Configure OPENROUTER_API_KEY para gerar respostas reais.',
      provider: 'mock',
      model: 'mock',
      stage: 'mock',
      attempts: [],
      generationMs: 0,
    }
  }
}
