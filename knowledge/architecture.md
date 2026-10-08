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

## 3. Assistente de IA Conversacional (RAG Context Injection)

O serviço `aiService.js` encapsula a lógica de conexão com o Google Gemini através do LangChain:
- **Context Injection:** Injeta a biografia técnica canônica, métricas de carreira, cases e stack de Elessandro Prestes Macedo no prompt.
- **Language Guiding:** Injeta diretiva estrita orientando a linguagem de resposta de acordo com a seleção atual do visitante (Inglês ou Português).
- **Multi-Model Failover:** Em caso de sobrecarga (503 Service Unavailable) ou erro de API, realiza transição suave para modelos alternativos estáveis.
