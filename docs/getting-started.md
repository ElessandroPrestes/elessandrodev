# Getting Started — Primeiros Passos

> Guia para execução local, desenvolvimento e fluxo SDD no projeto `elessandrodev`.

---

## 1. Pré-requisitos
- Node.js (versão 18+) e npm **OU** Docker e Docker Compose.
- Chave de API do Google Gemini ([Google AI Studio](https://aistudio.google.com/)).

---

## 2. Instalação e Execução

### Opção A: Node.js Local
```bash
# Clone e entre no diretório
git clone https://github.com/ElessandroPrestes/elessandrodev.git
cd elessandrodev

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env inserindo sua chave VITE_GEMINI_API_KEY

# Instale dependências
npm install

# Inicie o servidor Vite
npm run dev
```

### Opção B: Docker e Makefile
```bash
# Subir containers
make up

# Visualizar logs
make logs

# Derrubar containers
make down
```

---

## 3. Como Desenvolver sob o Universal SDD

1. **Criar uma SPEC:**
   ```bash
   cp templates/spec/SPEC-TEMPLATE.md specs/SPEC-001-nome-da-feature.md
   ```
2. **Submeter ao PO (Elessandro Prestes Macedo)** para aprovação formal.
3. **Criar a TASK correspondente:**
   ```bash
   cp templates/task/TASK-TEMPLATE.md tasks/TASK-001-nome-da-feature.md
   ```
4. **Implementar o escopo estritamente aprovado.**
5. **Validar com build:**
   ```bash
   npm run build
   ```
6. **Preencher QA e Review** em `reviews/`.
7. **Atualizar `PROJECT.md` e `CHANGELOG.md`.**
