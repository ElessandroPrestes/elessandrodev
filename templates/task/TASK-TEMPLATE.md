# TASK-XXX — [Título da Task]

| Campo              | Valor                                         |
|--------------------|-----------------------------------------------|
| **ID**             | TASK-XXX                                      |
| **SPEC**           | SPEC-XXX                                      |
| **Data de início** | YYYY-MM-DD                                    |
| **Agente**         | Gemini/Antigravity / Claude Code / Copilot    |
| **Status**         | Aberta / Em progresso / Concluída / Bloqueada  |

---

## Escopo da Implementação

> Baseado na SPEC-XXX aprovada, esta TASK implementa estritamente:

- Item 1
- Item 2

---

## Arquivos a Criar

| Arquivo                             | Descrição                |
|-------------------------------------|--------------------------|
| `src/components/Novo.vue`           | Novo componente Vue 3    |

---

## Arquivos a Modificar

| Arquivo                    | Mudança                              |
|----------------------------|--------------------------------------|
| `src/App.vue`              | Integração do novo componente        |
| `src/i18n/locales/pt.js`   | Strings em Português                 |
| `src/i18n/locales/en.js`   | Strings em Inglês                    |
| `PROJECT.md`               | Atualizar estado canônico            |
| `CHANGELOG.md`             | Registrar mudança de versão          |

---

## Checklist de Implementação

- [ ] Componente desenvolvido em Vue 3 com `<script setup>`
- [ ] Mobile First rigoroso (breakpoints: `sm`, `md`, `lg`, `xl`)
- [ ] Suporte pleno a Light e Dark Mode
- [ ] Semântica HTML acessível e atributos ARIA
- [ ] Textos internacionalizados em `pt.js` e `en.js`
- [ ] Zero dependências redundantes instaladas
- [ ] Zero quebras de estilo no Tailwind CSS
- [ ] Mensagens de commit em Português do Brasil (pt-BR)

---

## Checklist de Validação & QA

- [ ] `npm run build` executado com sucesso e zero erros
- [ ] Verificação visual em Mobile (375px) e Desktop (1280px)
- [ ] Verificação da alternância de tema (Dark/Light)
- [ ] Verificação da alternância de idioma (PT/EN)
- [ ] Navegação por teclado (Tab, Shift+Tab, Enter)

---

## Evidências de Conclusão

### Resultado do Build
```bash
# Cole a saída do comando npm run build aqui
```

---

## Notas do Agente

> Registrar aqui decisões tomadas durante a execução, limites respeitados da SPEC
> e confirmação de conformidade com o Product Owner.
