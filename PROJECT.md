# PROJECT.md — Estado Canônico do Projeto

> **Nota:** Este é o documento de referência canônica absoluta do projeto **elessandrodev**.  
> Qualquer divergência entre este documento, as SPECs, o código e as evidências de QA deve ser tratada como defeito, mudança de escopo ou dívida documental — nunca resolvida silenciosamente.

---

## 1. Identificação

| Campo             | Valor                                                                                                    |
|-------------------|----------------------------------------------------------------------------------------------------------|
| **Nome**          | `elessandrodev` — Portfólio Interativo & Assistente de IA                                                |
| **Repositório**   | `ElessandroPrestes/elessandrodev`                                                                        |
| **URL Produção**  | [https://elessandroprestes.github.io/elessandrodev/](https://elessandroprestes.github.io/elessandrodev/) |
| **Deploy**        | GitHub Pages via GitHub Actions                                                                          |
| **Versão**        | 1.5.0                                                                                                    |
| **Autor**         | Elessandro Prestes Macedo (Software Engineer & Tech Lead)                                                |
| **Contato**       | [LinkedIn](https://www.linkedin.com/in/elessandro-prestes-macedo/) • WhatsApp: +55 (45) 99917-8290       |
| **Governança**    | **Universal SDD (Spec-Driven Development)**                                                              |

---

## 2. Propósito do Projeto

Portfólio de engenharia de software de alto impacto demonstrando senioridade técnica, histórico de liderança arquitetural, projetos de missão crítica e aplicação de IA no ciclo de desenvolvimento de software (SDD / RAG).

O projeto conta com:
1. **Design System Editorial:** Estética monocromática de alta precisão técnica com tipografia editorial (Space Grotesk, Inter, JetBrains Mono), Dark & Light Mode dinâmicos e conformidade estrita com WCAG 2.1 AA.
2. **Terminal de IA Conversacional (RAG com Streaming):** Assistente embarcado com orquestração via LangChain.js e Google Gemini, injetando todo o contexto profissional, métricas e projetos do autor para interagir em tempo real com recrutadores e líderes técnicos, com entrega token-a-token e resiliência multicamadas.
3. **Internacionalização (i18n):** Suporte nativo e fluido a Português (PT-BR) e Inglês (EN).

---

## 3. Stack Tecnológica Canônica

### 3.1 Frontend & Interface
| Tecnologia           | Versão   | Papel / Justificativa                                                     |
|----------------------|----------|---------------------------------------------------------------------------|
| **Vue.js**           | ^3.4.0   | Core da UI com Composition API, `<script setup>` e reatividade declarativa |
| **Vite**             | ^6.2.0   | Ferramenta de build de última geração e servidor de desenvolvimento       |
| **Tailwind CSS**     | ^3.4.0   | Estilização orientada a utilitários com tokens de cores e modo escuro     |
| **PostCSS**          | ^8.4.0   | Pipeline de transformação de CSS e prefixagem automática                  |
| **Marked**           | ^18.0.10 | Renderizador seguro de Markdown para as respostas da IA conversacional    |

### 3.2 Inteligência Artificial & Orquestração
| Tecnologia                     | Versão   | Papel / Justificativa                                                    |
|--------------------------------|----------|--------------------------------------------------------------------------|
| **LangChain.js**               | ^1.5.9   | Construção de cadeias de inferência (Chains), PromptTemplates e Parsers   |
| **@langchain/google-genai**    | ^2.2.0   | Conector oficial com a API do Google Generative AI (Gemini)              |
| **Google Gemini API**          | v1beta   | Modelo primário `gemini-3.5-flash`, fallback para `gemini-3.5-flash-lite`|

### 3.3 Infraestrutura, Tooling & CI/CD
| Tecnologia           | Versão   | Papel / Justificativa                                                     |
|----------------------|----------|---------------------------------------------------------------------------|
| **GNU Make**         | Padrão   | Automação unificada de comandos de desenvolvimento, teste e build         |
| **Docker & Compose** | OCI      | Ambiente de desenvolvimento encapsulado e independente do SO host         |
| **GitHub Actions**   | v4       | Pipeline automatizada de build, validação e deploy contínuo no Pages      |

---

## 4. Arquitetura da Aplicação

### 4.1 Estrutura de Diretórios Canônica
```
src/
├── components/          # Componentes visuais atômicos e seções
│   ├── Header.vue       # Masthead, coordenadas numéricas e alternadores
│   ├── Statement.vue    # Hero statement, métricas de carreira e CTAs
│   ├── Projects.vue     # Seção de projetos selecionados (Selected Work)
│   ├── Architecture.vue # Casos e métricas arquiteturais (Core Engineering)
│   ├── Experience.vue   # Trajetória profissional e histórico (Trajectory)
│   ├── Toolbox.vue      # Matriz de tecnologias e ferramentas (Toolbox)
│   ├── Footer.vue       # Rodapé técnico e links de contato
│   ├── AiAssistant.vue  # Terminal conversacional de IA flutuante (Streaming)
│   ├── ThemeToggle.vue  # Seletor de tema claro/escuro
│   └── LanguageToggle.vue # Seletor de idioma (PT/EN)
├── composables/         # Lógica reativa reutilizável desacoplada
│   ├── useTheme.js      # Gerenciamento de tema e persistência
│   └── useI18n.js       # Gerenciamento de estado de idioma e dicionário
├── config/              # Configurações centralizadas
│   └── aiConfig.js      # Governança de parâmetros de IA, retries, timeout e telemetria
├── i18n/locales/        # Dicionários de internacionalização
│   ├── pt.js            # Conteúdo canônico em Português do Brasil
│   └── en.js            # Conteúdo canônico em Inglês
├── services/            # Serviços de integração externa
│   ├── aiService.js     # Integração com LangChain, streaming e resiliência
│   └── aiService.test.mjs # Suíte de testes automatizados (Cenários A-F)
├── style.css            # Diretivas do Tailwind CSS e fontes tipográficas
├── App.vue              # Shell principal da aplicação
└── main.js              # Ponto de entrada da aplicação Vue
```

### 4.2 Fluxo de Execução com Streaming e Resiliência
```
[Usuário envia mensagem]
         │
         ▼
[AiAssistant.vue]
  ├─ Valida palavras-chave de menu local
  └─ Dispara streamAssistant(content, locale, { onToken, onStatus })
         │
         ▼
[aiService.js + aiConfig.js]
  ├─ Injeta Contexto do Portfólio (ELESSANDRO_CONTEXT)
  ├─ Adiciona Instrução Estrita de Idioma (PT / EN)
  ├─ Constrói PromptTemplate
  │
  ├─ Tier 1: Modelo Primário (gemini-3.5-flash)
  │    ├─ Executa chain.stream() com AbortController (timeout: 30s)
  │    ├─ Se Sucesso ──► Emite tokens via onToken (TTFT ~3.2s) ──► Renderiza progressivo no Vue
  │    │
  │    └─ Se Erro Transitório (503, 502, 504, 429, timeout, network):
  │         ├─ Se antes do 1º token:
  │         │    ├─ onStatus("Tentando restabelecer...")
  │         │    └─ Retry com Backoff Exponencial + Jitter (até 2 tentativas)
  │         │
  │         └─ Se após o 1º token:
  │              └─ Interrompe geração preservando saída parcial (sem duplicação)
  │
  └─ Tier 2: Modelo Fallback (gemini-3.5-flash-lite)
       └─ Se retries do Tier 1 esgotados:
            ├─ onStatus("Tentando uma alternativa...")
            └─ Executa fallback automaticamente
```

---

## 5. Padrões de Qualidade & Quality Gates

1. **Build Estável:** O comando `npm run build` deve compilar com 0 erros.
2. **Acessibilidade:**
   - Suporte completo a navegação por teclado (`Tab`, `Shift+Tab`, `Enter`).
   - Contraste mínimo WCAG 2.1 AA (4.5:1 para texto normal, 3:1 para texto grande).
   - Skip links funcionais para foco rápido no conteúdo.
3. **Design Editorial & Mobile First:**
   - 320px, 640px, 768px, 1024px, 1280px e 1536px testados sem overflow horizontal.
4. **Resiliência e Streaming de IA:**
   - Suíte `src/services/aiService.test.mjs` com 100% de aprovação nos 12 testes dos cenários canônicos (A, B, C, D, E e F).
   - TTFT reduzido substancialmente via streaming progressivo.

---

## 6. Avaliação de Segurança e Débito Arquitetural

> **Nota de Governança SDD:** Atualmente, a aplicação é uma SPA puramente estática servida no GitHub Pages. As chamadas ao Google Gemini ocorrem diretamente pelo navegador do cliente utilizando a variável `VITE_GEMINI_API_KEY`.
>
> **Risco Mapeado:** Como não existe backend intermediário ou proxy serverless no repositório atual, a chave de demonstração fica exposta no bundle estático.
>
> **Mitigação Atual:** A chave do Google AI Studio possui restrições de cota gratuitas configuradas no console do provedor.
>
> **Próxima Etapa Recomendada:** Migração para arquitetura BFF (Backend-for-Frontend) via Cloudflare Workers ou Vercel Serverless Functions para encapsular a chave de API, autenticação e rate limiting no servidor.

---

## 7. Próximos Passos & Backlog Estratégico (Universal SDD)

- [x] **SPEC-001 [IA & Resiliência]:** Refatoração do chat com streaming reativo, eliminação do alias instável `gemini-flash-latest`, retries com jitter e modelo de contingência (Concluída em v1.4.0).
- [x] **SPEC-002 [Conteúdo & i18n]:** Suporte a currículos bilíngues dinâmicos (PT-BR e EN) com integridade de assets e sincronização cadastral da trajetória na EPM DEVTECH (Concluída em v1.5.0).

> **Backlog Estratégico (Mapeado em `ROADMAP.md` para execução futura mediante SPEC aprovada):**

1. **SPEC-003 [Segurança]:** Criação de Backend-for-Frontend (BFF) Serverless (Cloudflare Workers ou Vercel Edge) para eliminar a exposição de `VITE_GEMINI_API_KEY` no bundle do navegador e aplicar rate limiting por IP.
2. **SPEC-004 [Performance]:** Code splitting e otimização de chunks no Vite (`build.rollupOptions.output.manualChunks`) para segmentar `@langchain/*`, `marked` e `vue`, mantendo os chunks < 500 kB.
3. **SPEC-005 [Experiência de Usuário]:** Histórico conversacional com janela deslizante (últimas 3 a 5 mensagens) com teto controlado de tokens para manter contexto sem inflar custos.
4. **SPEC-006 [CI/CD]:** Pipeline de automação de Quality Gates no GitHub Actions para execução de `node src/services/aiService.test.mjs` e `npm run build` a cada Pull Request.
