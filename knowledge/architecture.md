# Base de Conhecimento: Arquitetura — elessandrodev

> Padrões arquiteturais, fluxo de estado e princípios de design de software.

---

## 1. Padrão Arquitetural

A aplicação segue uma arquitetura **Single Page Application (SPA)** desacoplada e estática:
- Shell de aplicação leve montada no `#app` pelo `main.js`.
- Componentização modular com responsabilidade única por componente.
- Gerenciamento de estado local via Composables (`useTheme.js`, `useI18n.js`), dispensando bibliotecas pesadas de store global (como Pinia ou Vuex) devido à simplicidade e alta performance necessárias para um portfólio estático.

---

## 2. Internacionalização Reativa

O composable `useI18n.js` armazena o idioma ativo (`locale = ref('pt')`) com suporte a persistência no `localStorage`.
Os dicionários `pt.js` e `en.js` exportam objetos idênticos em estrutura de chaves:
- `header`
- `statement`
- `projects`
- `architecture`
- `experience`
- `toolbox`
- `footer`
- `aiAssistant`

Quando o usuário alterna o idioma via `LanguageToggle.vue`, a computada `messages` reage instantaneamente, atualizando todos os nós do DOM sem recarregamento de página.

---

## 3. Assistente de IA Conversacional (RAG real)

O serviço `aiService.js` envia `{ question, locale }` para o Cloudflare Worker:
- **Retrieval:** o Worker gera o embedding da pergunta com Workers AI, consulta o índice versionado e aplica cosseno + BM25 com threshold.
- **Context Injection:** apenas os trechos recuperados entram no prompt, com instrução de idioma e proibição de inventar fatos.
- **Sources:** a resposta inclui `sources` com seção e score; a UI exibe as fontes consultadas.
- **Multi-Model Failover:** em caso de erro ou resposta inválida, o Worker tenta o próximo modelo da OpenRouter. Sem chunks relevantes, responde sem chamar o LLM.
