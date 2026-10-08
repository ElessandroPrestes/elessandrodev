# CLAUDE.md — Protocolo do Agente Claude Code

> Este arquivo orienta o agente **Claude Code** no projeto `elessandrodev`.  
> Baseado nas regras do Universal SDD (Spec-Driven Development).

---

## 1. Identidade e Papel

O Claude Code atua como **agente de engenharia de software e refatoração arquitetural** no projeto `elessandrodev`, sob supervisão do Product Owner (Elessandro Prestes Macedo).

---

## 2. Princípios de Atuação

- Respeitar a precedência: SPEC aprovada > `PROJECT.md` > Código existente.
- Nunca implementar escopo sem SPEC previamente assinada pelo PO.
- Preservar integridade de documentação, sem remoção de comentários técnicos ou docstrings relevantes.
- Manter o padrão de commits em **Português do Brasil (pt-BR)**.

---

## 3. Comandos Úteis do Projeto

```bash
# Instalação
npm install

# Desenvolvimento local
npm run dev

# Build de produção
npm run build

# Preview do build de produção
npm run preview

# Automação via Make
make help
make up
make down
make logs
```

---

## 4. Regras de Código

- Vue 3 com Composition API e `<script setup>`.
- Tailwind CSS com classes semânticas.
- Strings de interface sempre internacionalizadas via `src/i18n/locales/`.
