# Universal SDD (Spec-Driven Development) Framework

> **Status:** Em desenvolvimento ativo (v1.0.0-rc).  
> **Propósito:** Framework universal para aplicar Spec-Driven Development (SDD) em qualquer projeto de software, utilizando humanos e agentes de IA de forma organizada, previsível, determinística e auditável.

---

## 1. O que é o Universal SDD?

O **Universal SDD (USF)** é um framework open source para desenvolvimento orientado por especificações (Spec-Driven Development).

Seu objetivo é transformar requisitos aprovados em implementação rastreável, criando um processo reutilizável para qualquer linguagem, arquitetura ou ferramenta de IA.

O framework utiliza **três fontes complementares e soberanas**:
1. A **SPEC aprovada** define o comportamento desejado de uma mudança.
2. O **PROJECT.md** registra o estado canônico do projeto.
3. O **código e as evidências de QA** comprovam o comportamento implementado.

> **Regra Áurea:** Qualquer divergência entre essas fontes deve ser tratada como defeito, mudança de escopo ou dívida documental — **nunca resolvida silenciosamente**.

---

## 2. Princípios Fundamentais

1. **A SPEC aprovada define o comportamento desejado da mudança.** Nenhuma linha de código de produção é escrita sem uma especificação prévia.
2. **O `PROJECT.md` registra o estado canônico do projeto.** Ele é a verdade viva da aplicação.
3. **Código e evidências de QA comprovam o comportamento entregue.** Nenhuma tarefa é concluída sem comprovação reproduzível.
4. **Toda implementação começa por uma SPEC.** Não há atalhos.
5. **Interfaces começam por discovery e design aprovados antes da implementação.**
6. **Toda SPEC precisa de aprovação humana explícita.** A IA propõe, o Product Owner (humano) decide.
7. **A IA implementa apenas o escopo aprovado.** Proibida a expansão não autorizada de escopo (*scope creep*).
8. **Toda implementação deve passar pelos quality gates aplicáveis.**
9. **Mudanças de interface exigem revisão de design e acessibilidade.**
10. **Mudanças arquiteturais geram ADRs (Architectural Decision Records).**
11. **A documentação evolui junto com o código.** Pull Requests sem atualização documental são incompletos.

---

## 3. Ciclo de Vida Universal SDD

```
Ideia
  ↓
Discovery de Produto e UX
  ↓
Arquitetura
  ↓
UX/UI Design
  ↓
Aprovação do Design
  ↓
SPEC Técnica e Funcional
  ↓
Aprovação Humana (PO)
  ↓
TASK (Detalhamento Técnico)
  ↓
Implementação Controlada
  ↓
QA Automatizado e Manual (Evidências)
  ↓
Design Review & Code Review
  ↓
Refatoração (se necessário)
  ↓
Documentação (PROJECT.md / CHANGELOG.md)
  ↓
Release
```

---

## 4. Matriz de Compatibilidade

O framework é independente de tecnologia e funciona de modo uniforme com:

- **Linguagens:** JavaScript, TypeScript, PHP, Python, Go, Java, C#, Rust, Kotlin, Swift.
- **Frameworks:** Vue.js, React, Next.js, Angular, Laravel, Symfony, NestJS, Express, Spring, .NET.
- **Ferramentas de IA:** Antigravity / Gemini, Claude Code, GitHub Copilot, ChatGPT, Cursor, Windsurf, Aider.

---

## 5. Estrutura Canônica de Diretórios

```
├── PROJECT.md                # Estado canônico atual do projeto
├── AGENTS.md                 # Protocolo comum para pessoas e agentes de IA
├── GEMINI.md                 # Protocolo do agente Gemini / Antigravity
├── CLAUDE.md                 # Protocolo do agente Claude Code
├── COPILOT.md                # Protocolo do agente GitHub Copilot
├── UNIVERSAL_SDD_FRAMEWORK.md# Norma canônica deste framework
├── ROADMAP.md                # Planejamento e evolução
├── specs/                    # Especificações ativas e históricas (SPEC-NNN)
├── tasks/                    # Tarefas de implementação (TASK-NNN)
├── reviews/                  # Reviews de código, design e QA (REVIEW-NNN, QA-NNN)
├── adr/                      # Architectural Decision Records (ADR-NNN)
├── standards/                # Padrões obrigatórios (qualidade, acessibilidade, etc.)
├── knowledge/                # Base de conhecimento de stack, arquitetura e convenções
├── workflows/                # Workflows canônicos (feature, bugfix, hotfix)
├── profiles/                 # Perfis operacionais de desenvolvimento e QA
├── agents/                   # Missões e escopos dos papéis e agentes
├── templates/                # Modelos executáveis de artefatos
└── docs/                     # Documentação aprofundada de governança e arquitetura
```
