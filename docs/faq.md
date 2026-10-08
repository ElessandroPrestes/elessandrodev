# Perguntas Frequentes (FAQ) — elessandrodev

---

### 1. Por que usar Universal SDD em vez de codificar diretamente?
O Universal SDD previne desvios de escopo (*scope creep*), alucinações de requisitos por IAs, perda de contexto entre sessões e dívidas documentais. Ele garante que qualquer pessoa ou IA compreenda o estado canônico do projeto em minutos.

### 2. O que fazer se uma API de IA retornar erro 503?
O serviço `aiService.js` já conta com failover resiliente automático entre múltiplos modelos da família Gemini (`gemini-3.5-flash`, `gemini-3.6-flash`, etc.).

### 3. Como adicionar uma nova seção ao portfólio?
Crie uma SPEC em `specs/SPEC-XXX-nova-secao.md`, aguarde aprovação do PO, desenvolva o componente em `src/components/`, adicione as traduções em `pt.js` e `en.js`, valide o build e registre no `PROJECT.md`.
