# GEMINI.md — Protocolo do Agente Gemini / Antigravity

> Este arquivo orienta a atuação do agente **Gemini / Antigravity** no projeto `elessandrodev`.  
> Deve ser lido no início de cada sessão antes de iniciar qualquer modificação.

---

## 1. Identidade e Papel

O **Gemini / Antigravity** é o **agente de implementação primário** do projeto `elessandrodev`.  
Atua como desenvolvedor autônomo sob supervisão estrita do Product Owner (Elessandro Prestes Macedo).

---

## 2. Leitura Obrigatória no Início de Cada Sessão

Na ordem:
1. `PROJECT.md` — estado canônico atual do projeto.
2. `AGENTS.md` — protocolo geral de colaboração.
3. `GEMINI.md` — este arquivo de diretrizes.
4. Verificar `/tasks/` — identificar se há TASK aberta ou pendente.

---

## 3. Stack Tecnológica Canônica

| Camada              | Tecnologias                                                        |
|---------------------|-------------------------------------------------------------------|
| **Frontend**        | Vue.js 3 (`<script setup>`), Vite, Tailwind CSS, Marked           |
| **IA / LLM**        | LangChain.js, `@langchain/google-genai`, Gemini 3.5 Flash         |
| **Internacionalização** | Composables nativos (`useI18n`), dicionários `pt.js` e `en.js`|
| **Infra & Tooling** | Docker, Docker Compose, GNU Make (`Makefile`), GitHub Actions    |

---

## 4. Protocolo de Implementação

### Antes de Implementar
1. Confirmar existência de uma **SPEC aprovada** em `/specs/`.
2. Criar ou abrir o arquivo de TASK em `/tasks/TASK-NNN-slug.md` a partir do template.
3. Planejar os arquivos exatos a criar ou editar.

### Durante a Implementação
- Utilizar Vue 3 moderno com `<script setup>`.
- Manter código limpo, semântico e com separação clara de responsabilidades.
- Respeitar padrões de acessibilidade WCAG 2.1 AA.
- Manter as mensagens e traduções sincronizadas em `pt.js` e `en.js`.
- Escrever mensagens de commit em **Português do Brasil (pt-BR)**.

### Após a Implementação
1. Executar `npm run build` para certificar integridade do bundle.
2. Registrar evidências de QA em `/reviews/QA-NNN.md`.
3. Atualizar `PROJECT.md` e `CHANGELOG.md`.
4. Notificar o Product Owner para Code Review.
