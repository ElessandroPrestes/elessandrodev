# Perguntas Frequentes (FAQ) — elessandrodev

---

### 1. Por que usar Universal SDD em vez de codificar diretamente?
O Universal SDD previne desvios de escopo, alucinações de requisitos por IAs, perda de contexto entre sessões e dívidas documentais. Ele garante que qualquer pessoa ou IA compreenda o estado canônico do projeto em minutos.

### 2. O que acontece se o Worker ou o LLM falhar?
O cliente faz retry com backoff exponencial em erros transitórios (`429`, `5xx`, timeout e rede). O Worker tenta uma cadeia de modelos da OpenRouter e, se nenhum responder, devolve uma mensagem amigável em PT/EN. Se nenhum chunk atingir o threshold, o Worker responde sem chamar o LLM.

### 3. Onde fica a chave da OpenRouter?
Somente como secret do Cloudflare Worker:

```bash
npx wrangler secret put OPENROUTER_API_KEY
```

Ela não existe no bundle do frontend nem no GitHub Pages.

### 4. Como atualizar o conteúdo do assistente?
Edite os arquivos em `knowledge/rag/`, rode `npm run rag:index`, valide com `npm run rag:eval` e `npm run rag:check`, e faça deploy do Worker com `npx wrangler deploy`.

### 5. Como rodar localmente?
```bash
npm install
npm run dev
```

Acesse `http://localhost:5212/elessandrodev/`. O frontend local consome o Worker publicado; não é necessário configurar a chave da OpenRouter na máquina.

### 6. Como adicionar uma nova seção ao portfólio?
Crie uma SPEC em `specs/SPEC-XXX-nova-secao.md`, aguarde aprovação do PO, desenvolva o componente em `src/components/`, adicione as traduções em `pt.js` e `en.js`, valide o build e registre no `PROJECT.md`.
