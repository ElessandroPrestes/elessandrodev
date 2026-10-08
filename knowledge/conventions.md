# Base de Conhecimento: Convenções de Código — elessandrodev

> Convenções sintáticas, estruturais e de versionamento do projeto.

---

## 1. Nomenclatura de Arquivos e Componentes

- **Componentes Vue:** PascalCase (`Statement.vue`, `AiAssistant.vue`, `ThemeToggle.vue`).
- **Composables:** CamelCase prefixado por `use` (`useTheme.js`, `useI18n.js`).
- **Serviços:** CamelCase com sufixo `Service` (`aiService.js`).
- **Arquivos de Localização:** Código ISO em minúsculo (`pt.js`, `en.js`).

---

## 2. Convenções em Componentes Vue

- Utilizar sempre `<script setup>`.
- Ordem do SFC (Single File Component):
  1. `<script setup>`
  2. `<template>`
  3. `<style>` (apenas se estritamente necessário; priorizar Tailwind CSS)
- Desestruturação clara de composables e props.
- Nenhuma string de interface textual deve ser colocada diretamente no template em hardcode; utilizar o composable `useI18n()`.

---

## 3. Mensagens de Commit

- Padrão **Conventional Commits**.
- **Obrigatoriamente em Português do Brasil (pt-BR)**.
- Formato: `<tipo>(<escopo opcional>): <descrição em minúsculas>`
- Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
- Exemplos:
  - `feat(ai): adiciona fallback resiliente para modelos gemini`
  - `fix(favicon): cria favicon vetorial para eliminar erro 404`
  - `docs(sdd): aplica governança universal sdd no projeto`
