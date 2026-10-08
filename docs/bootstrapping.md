# Bootstrapping de Projetos com Universal SDD

> Como inicializar ou adaptar um novo repositório para o Universal SDD.

---

## 1. Passo a Passo de Adoção

1. **Copie a estrutura do Universal SDD** para a raiz do seu repositório:
   - `templates/`, `standards/`, `knowledge/`, `workflows/`, `profiles/`, `agents/`, `docs/`, `specs/`, `tasks/`, `reviews/`, `adr/`.
2. **Solicite ao agente de IA** que leia todos os arquivos de código e infraestrutura do repositório.
3. **Gere o `PROJECT.md` canônico**, detalhando stack, arquitetura, módulos e estado atual.
4. **Crie os arquivos de protocolo de agentes:** `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, etc.
5. **Preencha a Base de Conhecimento:** `knowledge/stack.md`, `knowledge/conventions.md`.
6. **Defina os Quality Gates e Padrões:** `standards/quality-gates.md`, `standards/testing.md`.
7. **Comece toda e qualquer mudança subsequente por uma SPEC aprovada.**
