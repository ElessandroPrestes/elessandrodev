import type { Logger } from 'pino'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import type { Runnable } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import type { AppConfig } from '../../config/env.js'
import {
  ProviderUnavailableError,
  RateLimitedError,
  TimeoutError,
  isAbortError,
  statusFromUnknown,
} from '../../shared/errors.js'
import type { CircuitBreaker } from '../../shared/circuit-breaker.js'
import {
  calculateBackoff,
  isTransientError,
  sleep,
} from '../../shared/retry.js'
import { cjkRatio, sanitizeAnswer } from '../../shared/text.js'
import { withTimeout } from '../../shared/timeout.js'
import type {
  LlmAttempt,
  LlmClient,
  LlmGenerateInput,
  LlmGenerateResult,
} from './types.js'

type ChatChain = Runnable<{ system: string; user: string }, string>
export type ChainFactory = (model: string) => ChatChain

export function createLangChainChain(
  config: AppConfig,
  model: string,
): ChatChain {
  const chat = new ChatOpenAI({
    apiKey: config.llm.apiKey,
    model,
    temperature: config.llm.temperature,
    maxTokens: config.llm.maxTokens,
    configuration: {
      baseURL: config.llm.baseUrl,
      timeout: config.llm.timeoutMs,
      maxRetries: 0,
      defaultHeaders: {
        'HTTP-Referer': config.llm.siteUrl,
        'X-Title': config.llm.appTitle,
      },
    },
  })

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', '{system}'],
    ['human', '{user}'],
  ])

  return prompt.pipe(chat).pipe(new StringOutputParser())
}

function retryAfterFromError(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const candidate = error as {
    headers?: Record<string, string | undefined>
    response?: { headers?: Record<string, string | undefined> }
  }
  const raw =
    candidate.headers?.['retry-after'] ??
    candidate.response?.headers?.['retry-after']

  if (!raw) return undefined
  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds)
  const date = Date.parse(raw)
  if (Number.isFinite(date)) {
    return Math.max(1, Math.ceil((date - Date.now()) / 1000))
  }
  return undefined
}

function isTimeoutLike(error: unknown): boolean {
  return (
    error instanceof TimeoutError ||
    isAbortError(error) ||
    (error instanceof Error && error.message.toLowerCase().includes('timeout'))
  )
}

export class LangChainOpenRouterClient implements LlmClient {
  readonly mode = 'openrouter' as const
  private readonly chains = new Map<string, ChatChain>()

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly breaker: CircuitBreaker,
    private readonly chainFactory: ChainFactory = (model) =>
      createLangChainChain(config, model),
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.llm.apiKey) && this.config.llm.models.length > 0
  }

  private chainFor(model: string): ChatChain {
    const existing = this.chains.get(model)
    if (existing) return existing
    const chain = this.chainFactory(model)
    this.chains.set(model, chain)
    return chain
  }

  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    if (!this.isConfigured()) {
      throw new ProviderUnavailableError(
        'Nenhum provedor de LLM configurado.',
        { stage: 'openrouter' },
      )
    }

    const startedAt = Date.now()
    const deadline =
      input.deadline ?? startedAt + this.config.llm.totalBudgetMs
    const attempts: LlmAttempt[] = []
    let lastStatus = 503
    let rateLimited = false
    let retryAfter: number | undefined

    for (const model of this.config.llm.models) {
      const key = `openrouter:${model}`

      if (this.breaker.isOpen(key)) {
        attempts.push({
          provider: 'openrouter',
          model,
          status: 503,
          durationMs: 0,
          ok: false,
          skipped: 'circuit-open',
        })
        continue
      }

      for (
        let attempt = 1;
        attempt <= this.config.llm.maxAttemptsPerModel;
        attempt += 1
      ) {
        const remaining = deadline - Date.now()
        if (remaining < 1000) {
          attempts.push({
            provider: 'openrouter',
            model,
            status: 504,
            durationMs: 0,
            ok: false,
            skipped: 'budget',
          })
          lastStatus = 504
          break
        }

        const callStartedAt = Date.now()
        const callTimeoutMs = Math.min(this.config.llm.timeoutMs, remaining)

        try {
          const chain = this.chainFor(model)
          const raw = await withTimeout(
            (signal) => chain.invoke({ system: input.system, user: input.user }, { signal }),
            callTimeoutMs,
            input.signal,
          )
          const durationMs = Date.now() - callStartedAt
          const text = sanitizeAnswer(raw)

          if (!text || cjkRatio(raw) > 0.1) {
            attempts.push({
              provider: 'openrouter',
              model,
              status: 502,
              durationMs,
              ok: false,
            })
            lastStatus = 502
            this.breaker.recordFailure(key)
            continue
          }

          attempts.push({
            provider: 'openrouter',
            model,
            status: 200,
            durationMs,
            ok: true,
          })
          this.breaker.recordSuccess(key)

          return {
            text,
            provider: 'openrouter',
            model,
            stage: 'openrouter',
            attempts,
            generationMs: Date.now() - startedAt,
          }
        } catch (error) {
          const durationMs = Date.now() - callStartedAt
          const status =
            statusFromUnknown(error) ?? (isTimeoutLike(error) ? 504 : 502)
          attempts.push({
            provider: 'openrouter',
            model,
            status,
            durationMs,
            ok: false,
          })

          lastStatus = status
          if (status === 429) {
            rateLimited = true
            retryAfter = retryAfterFromError(error) ?? retryAfter
            this.logger.warn(
              { model, status, durationMs },
              'openrouter model rate limited',
            )
            break
          }

          if (status === 401 || status === 403) {
            this.breaker.recordFailure(key)
            this.logger.error(
              { model, status },
              'openrouter authentication failed',
            )
            throw new ProviderUnavailableError(
              'Falha de autenticação no provedor de LLM.',
              { stage: 'openrouter', status: 503, code: 'LLM_AUTH_FAILED' },
            )
          }

          if (status === 400 || status === 422) {
            this.logger.error(
              { model, status },
              'openrouter rejected the request',
            )
            throw new ProviderUnavailableError(
              'O provedor de LLM rejeitou a requisição.',
              { stage: 'openrouter', status: 503, code: 'LLM_BAD_REQUEST' },
            )
          }

          if (!isTransientError(error)) {
            this.logger.warn(
              { model, status, message: (error as Error)?.message },
              'openrouter non-transient failure',
            )
            break
          }

          this.breaker.recordFailure(key)

          if (attempt < this.config.llm.maxAttemptsPerModel) {
            const delayMs = calculateBackoff(attempt, 250, 2000)
            this.logger.warn(
              { model, status, attempt, delayMs },
              'retrying openrouter model',
            )
            await sleep(delayMs, input.signal)
          }
        }
      }
    }

    if (rateLimited) {
      throw new RateLimitedError(
        'O assistente atingiu o limite de uso do provedor.',
        retryAfter ?? 3600,
        'openrouter',
      )
    }

    throw new ProviderUnavailableError(
      'Nenhum modelo do OpenRouter conseguiu responder.',
      {
        stage: 'openrouter',
        status: lastStatus === 504 ? 504 : 503,
        details: { attempts },
      },
    )
  }
}
