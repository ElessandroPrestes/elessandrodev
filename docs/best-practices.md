# Boas Práticas — elessandrodev

> Padrões recomendados para maximizar estabilidade, legibilidade e manutenibilidade.

---

## 1. Código
- Prefira composables pequenos e focados a arquivos monolíticos de utilitários.
- Utilize tipografia semântica e evite números mágicos em regras de estilo.
- Mantenha `useI18n` sincronizado: ao adicionar uma chave em `pt.js`, adicione obrigatoriamente a contraparte em `en.js`.

---

## 2. Inteligência Artificial
- Nunca execute chamadas a APIs de LLM sem tratamento robusto de erros e estratégias de contingência (fallback de modelos).
- Mantenha o contexto técnico canônico atualizado quando novas realizações ou certificações forem obtidas.
