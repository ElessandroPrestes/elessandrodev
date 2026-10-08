import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import {
  AI_CONFIG,
  isTransientError,
  calculateBackoff,
  recordTelemetry,
} from '../config/aiConfig.js'

export const ELESSANDRO_CONTEXT = `
Você é o assistente de IA oficial do portfólio de Elessandro Prestes Macedo.
Seu objetivo é responder perguntas de recrutadores, clientes e visitantes sobre a carreira, habilidades e projetos de Elessandro.

Informações sobre Elessandro Prestes Macedo:
- Título: Engenheiro de Software | PHP & Laravel | Backend & Full Stack | Arquitetura & IA Aplicada (Tech Lead).
- Experiência: Mais de 9 anos de experiência em desenvolvimento de software e liderança técnica.
- Especialidades: Arquitetura e desenvolvimento backend, modernização de sistemas legados (monólitos para microsserviços, BFF, Serverless, Strangler Fig Pattern), Clean Code, testes automatizados e IA aplicada ao ciclo de desenvolvimento (SDD, RAG e MCP).
- IA no Ciclo de Desenvolvimento: Aplica Inteligência Artificial no fluxo de engenharia utilizando SDD (Spec-Driven Development), RAG (Retrieval-Augmented Generation), MCP (Model Context Protocol) e assistentes de código (Claude Code, Google Gemini, GitHub Copilot, Codex), conectando especificações técnicas estruturadas ao ciclo de desenvolvimento para validar requisitos, manter a rastreabilidade e evitar retrabalho.
- Principais Tecnologias:
  * Backend: PHP (Laravel, Symfony), Node.js (Express, NestJS), TypeScript, JavaScript.
  * Frontend: Vue.js, Angular, React, Tailwind CSS, Vite.
  * Banco de Dados: MySQL/MariaDB, PostgreSQL, Oracle (PL/SQL), Redis, MongoDB, SQL Server.
  * Mensageria & Filas: RabbitMQ, Apache Kafka, Amazon MQ, AWS SQS/SNS.
  * DevOps & Cloud: Docker, Kubernetes, GitLab CI/CD, GitHub Actions, AWS (Lambda, ECS, SQS, CloudWatch), Azure (Monitor, Functions, IoT).
  * IA & Metodologia: Spec-Driven Development (SDD), Claude Code, GitHub Copilot, Codex, RAG, MCP (Model Context Protocol), LangChain.js, Google Gemini.
  * Testes: Pest, PHPUnit, Vitest, TDD, SonarQube.
- Histórico Profissional Relevante:
  * EPM DEVTECH (Jun/2026 - Atual): Líder Técnico em Engenharia de Software – Full Stack & Arquitetura de Sistemas. Planejamento e arquitetura de plataformas web completas, APIs escaláveis com PHP/Laravel, Node.js (Express, NestJS), soluções full stack com Vue.js/Angular/React, modernização de sistemas legados com Strangler Fig Pattern e consultoria em arquitetura de software.
  * EPM DEVTECH (Out/2025 - Mai/2026): Engenheiro de Software com IA Aplicada. Modernização de plataforma monolítica legada para PHP 8.2 e Laravel 12 via Strangler Fig Pattern de forma gradual e contínua, eliminando 56.400+ linhas legadas sem indisponibilidade de serviço; 2.399 testes automatizados (Pest/PHPUnit) em 241 arquivos; 384 endpoints REST e 181 migrations com integrações WhatsApp Business (-35% trabalho manual); uso de Claude Code, GitHub Copilot, Codex, RAG, MCP e SDD reduzindo retrabalho em 40% com Docker e GitLab CI/CD.
  * Datainfo / Projeto CAPES (Out/2024 - Set/2025): Analista Programador / Tech Lead. Modernização para microsserviços e BFF (Angular) no SIPREC para 448+ IES, 10.000 usuários simultâneos e 2.500 RPS (<300ms de latência média); atuação como Tech Lead no SISCAD com PHP/Laravel, Oracle DB, Redis e RabbitMQ; SonarQube (+45% qualidade e redução de vulnerabilidades); engenharia com IA aplicando SDD, RAG e GitHub Copilot aumentando entregas da sprint em 25% com mentoria técnica.
  * Energia Pecém (Mai/2023 - Jul/2024): Desenvolvedor Full Stack. Telemetria e rastreabilidade de ativos com Node.js, Laravel e Vue.js (+40% rastreabilidade); arquitetura orientada a eventos (EDA) com RabbitMQ, Redis e Laravel Jobs (+50% capacidade de processamento); 99,9% uptime e redução de 45% em incidentes com observabilidade no Azure Monitor.
  * AMcom / Projeto GENIN - ONS (Jul/2022 - Abr/2023): Desenvolvedor de Sistemas. Integrações regulatórias de dados (Itaipu e INMET) para cálculo de bandeiras tarifárias nacionais (ONS) via PHP/Laravel, REST/SOAP (100% integridade transacional); microsserviços com PostgreSQL e Redis (-40% latência na ingestão nacional); AWS CodeBuild, API Gateway e CloudWatch (-60% deploy time, 99,9% uptime).
  * Grupo Intellectus (Out/2021 - Jul/2022): Desenvolvedor Full Stack. Plataforma Serverless na AWS (Lambda, SQS, SNS) com redução de 35% de custos; plataforma educacional para 650+ escolas estaduais em 141 municípios (SEDUC-MT) com Angular e PHP/Laravel (99,9% uptime); ELK Stack (-50% MTTR) e GitHub Actions (+60% velocidade de entrega).
  * Grupo Paraíso (Ago/2016 - Set/2021): Desenvolvedor Full Stack. Desenvolvimento de sistemas para a cadeia têxtil, desde telemetria e chão de fábrica (IoT com Azure Cloud e WebSockets) até canais de venda (e-commerce, CRM corporativo) e migração gradual de ERP legado para microsserviços em Node.js (Strangler Fig Pattern, -40% custo de manutenção); módulos corporativos com PHP (Laravel, Symfony) e Oracle DB (+30% eficiência operacional); mensageria na AWS com Kafka, RabbitMQ, Redis e PostgreSQL (99,9% uptime).
- Principais Projetos em Destaque (GitHub):
  * elessandrodev (Vue.js 3, LangChain, RAG / LLM, Docker): Portfólio com assistente de IA conversacional integrado com LangChain e Gemini. Demo: https://elessandroprestes.github.io/elessandrodev/
  * universal-sdd (SDD, AI Agents, Claude Code, DevOps): Framework universal para Spec-Driven Development com agentes de IA.
  * event-driven-processing-system (EDA, RabbitMQ, Redis, Node.js, PostgreSQL): Pipeline assíncrono distribuído de eventos com mensageria e DLQ.
  * iot-mqtt-simulator (IoT, MQTT, Node.js, Vue.js, WebSockets): Monitoramento e ingestão de telemetria industrial em tempo real.
  * fintech-wallet-solution (PHP/Node.js, PostgreSQL, Redis, JWT, ACID): Core bancário e carteira digital full stack com controle transacional ACID de concorrência.

Diretrizes de resposta:
- Seja sempre profissional, educado, objetivo e conciso (máximo de 2 a 3 parágrafos curtos ou tópicos objetivos).
- Adote tom direto e pragmático de engenharia sênior. Evite clichês corporativos, fórmulas vazias ("não é apenas X, é Y") e adjetivos inflados.
- Use Markdown bem estruturado: tópicos com '-', negrito com moderação apenas em pontos-chave, e links no formato [LinkedIn](https://www.linkedin.com/in/elessandro-prestes-macedo/).
- Evite excesso de asteriscos, caracteres desnecessários ou separadores redundantes.
- Destaque a senioridade, capacidade arquitetural e realizações técnicas com métricas de Elessandro.
- Se não souber responder com precisão sobre um detalhe específico não mencionado, indique cordialmente que o visitante pode entrar em contato via LinkedIn.
`

function buildPrompt(locale, question) {
  const languageInstruction = locale === 'en'
    ? 'IMPORTANT INSTRUCTION: Respond strictly in professional, fluent English suitable for senior engineering recruiters and technical directors.'
    : 'INSTRUÇÃO DE IDIOMA: Responda estritamente em português brasileiro técnico e profissional.'

  const template = PromptTemplate.fromTemplate(`
{context}

{languageInstruction}

Histórico/Contexto da conversa atual:
Pergunta do visitante: {question}

Resposta:
`)

  return { template, languageInstruction }
}

/**
 * Função utilitária para aguardar com promessa
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Executa uma chamada com timeout controlado via AbortController
 */
async function invokeWithTimeout(streamPromiseFn, timeoutMs, externalSignal) {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort(new Error(`Timeout de ${timeoutMs}ms excedido na requisição ao LLM`))
  }, timeoutMs)

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason))
  }

  try {
    return await streamPromiseFn(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Executa inferência com Streaming reativo, retries limitados, exponential backoff,
 * timeout controlado e fallback entre modelos.
 *
 * @param {string} question - Pergunta do usuário
 * @param {string} locale - 'pt' ou 'en'
 * @param {Object} options - Configurações opcionais e callbacks
 * @param {Function} options.onToken - Callback chamado a cada chunk de token gerado
 * @param {Function} options.onStatus - Callback para atualizações de status UX (retry, fallback)
 * @param {AbortSignal} options.signal - Sinal externo para cancelamento
 * @param {string} options.primaryModel - Modelo principal a utilizar
 * @param {string} options.fallbackModel - Modelo de contingência
 * @param {number} options.maxRetries - Limite de retries em erros transitórios
 * @param {number} options.timeoutMs - Timeout em ms
 * @param {number} options.backoffBaseMs - Backoff base em ms
 * @returns {Promise<string>} Resposta completa gerada
 */
export async function streamAssistant(question, locale = 'pt', options = {}) {
  const apiKey = AI_CONFIG.apiKey

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chave VITE_GEMINI_API_KEY não configurada no arquivo .env')
  }

  const {
    onToken = () => {},
    onStatus = () => {},
    signal = null,
    primaryModel = AI_CONFIG.primaryModel,
    fallbackModel = AI_CONFIG.fallbackModel,
    maxRetries = AI_CONFIG.maxRetries,
    timeoutMs = AI_CONFIG.timeoutMs,
    backoffBaseMs = AI_CONFIG.backoffBaseMs,
  } = options

  const { template, languageInstruction } = buildPrompt(locale, question)

  // Ordem de execução: 1. Modelo Primário (com até maxRetries) -> 2. Modelo Fallback (com até 1 retry)
  const tiers = [
    { modelName: primaryModel, maxRetriesAllowed: maxRetries, isFallback: false },
    { modelName: fallbackModel, maxRetriesAllowed: 1, isFallback: true },
  ].filter((tier, index, self) => Boolean(tier.modelName) && self.findIndex(t => t.modelName === tier.modelName) === index)

  const startTime = performance.now()
  let accumulatedFullText = ''
  let hasEmittedFirstToken = false
  let firstTokenTime = null
  let totalRetriesPerformed = 0
  let fallbackUsed = false
  let lastAttemptError = null
  let successfulModel = null

  for (const tier of tiers) {
    if (tier.isFallback) {
      fallbackUsed = true
      onStatus(
        locale === 'en'
          ? 'Primary service temporarily unavailable. Trying an alternative model...'
          : 'Nosso serviço principal está temporariamente indisponível. Tentando uma alternativa...',
        'fallback'
      )
    }

    let attempt = 0
    while (attempt <= tier.maxRetriesAllowed) {
      attempt++
      const currentModelName = tier.modelName

      try {
        const modelInstance = new ChatGoogleGenerativeAI({
          apiKey,
          model: currentModelName,
          temperature: AI_CONFIG.temperature,
          maxRetries: 0, // Desativa retries automáticos internos do LangChain para governança controlada
        })

        const chain = template.pipe(modelInstance).pipe(new StringOutputParser())

        // Executa streaming com timeout
        await invokeWithTimeout(async (callSignal) => {
          const stream = await chain.stream(
            {
              context: ELESSANDRO_CONTEXT,
              languageInstruction,
              question,
            },
            { signal: callSignal }
          )

          for await (const chunk of stream) {
            if (!hasEmittedFirstToken) {
              hasEmittedFirstToken = true
              firstTokenTime = performance.now()
            }
            accumulatedFullText += chunk
            onToken(chunk, accumulatedFullText)
          }
        }, timeoutMs, signal)

        // Sucesso na geração
        successfulModel = currentModelName
        const totalDuration = performance.now() - startTime
        const ttft = firstTokenTime ? firstTokenTime - startTime : null

        recordTelemetry({
          model: successfulModel,
          status: 200,
          retryCount: totalRetriesPerformed,
          fallbackUsed,
          ttftMs: ttft,
          llmLatencyMs: totalDuration,
          totalLatencyMs: totalDuration,
        })

        return accumulatedFullText
      } catch (err) {
        lastAttemptError = err
        const errMessage = String(err?.message || err)
        console.warn(`[aiService] Falha na tentativa ${attempt} do modelo ${currentModelName}:`, errMessage)

        // REGRA CRÍTICA DE STREAMING:
        // Se a falha ocorreu APÓS o primeiro token ser emitido, NÃO repetir a geração do zero!
        if (hasEmittedFirstToken) {
          const streamInterruptedError = new Error(
            locale === 'en'
              ? 'The response was interrupted. Please try again.'
              : 'A resposta foi interrompida. Tente novamente.'
          )
          streamInterruptedError.hasPartialOutput = true
          streamInterruptedError.partialText = accumulatedFullText
          streamInterruptedError.originalError = err

          recordTelemetry({
            model: currentModelName,
            status: 499, // Interrupted stream
            retryCount: totalRetriesPerformed,
            fallbackUsed,
            ttftMs: firstTokenTime ? firstTokenTime - startTime : null,
            totalLatencyMs: performance.now() - startTime,
          })

          throw streamInterruptedError
        }

        // Se falhou antes do primeiro token, verificar se o erro é transitório
        const isTransient = isTransientError(err)

        if (!isTransient) {
          // Erro permanente (ex: 401, 404, modelo inexistente) -> não faz retries
          recordTelemetry({
            model: currentModelName,
            status: err?.status || 400,
            retryCount: totalRetriesPerformed,
            fallbackUsed,
            totalLatencyMs: performance.now() - startTime,
          })
          throw err
        }

        // Erro é transitório (503, 502, 504, 429, timeout, rede)
        if (attempt <= tier.maxRetriesAllowed) {
          totalRetriesPerformed++
          onStatus(
            locale === 'en'
              ? 'Reconnecting to AI service...'
              : 'Tentando restabelecer a conexão...',
            'retry'
          )
          const waitTime = calculateBackoff(attempt, backoffBaseMs)
          await sleep(waitTime)
          // Continua o loop while para próxima tentativa do mesmo tier
        } else {
          // Esgotou retries deste modelo; o loop sairá para o próximo tier (fallback)
          break
        }
      }
    }
  }

  // Se todos os tiers e retries falharam sem emitir nenhum token
  recordTelemetry({
    model: tiers[0]?.modelName,
    status: lastAttemptError?.status || 503,
    retryCount: totalRetriesPerformed,
    fallbackUsed,
    totalLatencyMs: performance.now() - startTime,
  })

  throw lastAttemptError
}

/**
 * Função legado para chamadas síncronas/completas sem streaming (mantida para compatibilidade)
 */
export async function askAssistant(question, locale = 'pt') {
  return await streamAssistant(question, locale, {})
}
