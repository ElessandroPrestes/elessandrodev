# COPILOT.md — Protocolo do GitHub Copilot

> Diretrizes para assistência de código via **GitHub Copilot** no projeto `elessandrodev`.

---

## 1. Diretrizes de Geração de Código

- Seguir estritamente Vue 3 com `<script setup>` e Composition API.
- Nunca inserir textos estáticos em hardcode nos templates Vue; sempre utilizar referências a `messages.<secao>.<chave>` do composable `useI18n()`.
- Seguir o Design System editorial com Tailwind CSS (paleta slate/neutral, toques de indigo e emerald).
- Evitar geração de dependências desnecessárias ou bibliotecas de runtime pesadas.
- Manter convenções de nomes: componentes em `PascalCase.vue`, composables em `useCamelCase.js`.
