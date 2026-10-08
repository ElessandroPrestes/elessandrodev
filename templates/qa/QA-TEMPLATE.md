# QA-XXX — Evidências de QA

| Campo            | Valor                                         |
|------------------|-----------------------------------------------|
| **ID**           | QA-XXX                                        |
| **TASK**         | TASK-XXX                                      |
| **SPEC**         | SPEC-XXX                                      |
| **Data**         | YYYY-MM-DD                                    |
| **Agente**       | Gemini/Antigravity / QA                       |
| **Status**       | ✅ Aprovado / ❌ Reprovado                    |

---

## Resultado do Build de Produção

| Verificação        | Resultado | Status   |
|--------------------|-----------|----------|
| Build Vite         | 0 erros   | ✅ OK    |
| CSS Gzip           | < 50 KB   | ✅ OK    |
| JS Gzip            | Otimizado | ✅ OK    |

```bash
# Output do npm run build
```

---

## Checklist de Testes Manuais

### Responsividade
- [ ] Mobile (320px / 375px): layout sem overflow horizontal
- [ ] Tablet (768px): distribuição equilibrada
- [ ] Desktop (1024px+ / 1440px): max-width respeitado

### Temas
- [ ] Dark mode: contrastes preservados
- [ ] Light mode: legibilidade e contraste
- [ ] Troca dinâmica: transição consistente sem flash de conteúdo incorreto

### Internacionalização (i18n)
- [ ] Português (PT-BR): todos os termos traduzidos
- [ ] Inglês (EN): todos os termos traduzidos
- [ ] Alternância de idioma instantânea e sem recarregamento

### Acessibilidade (WCAG 2.1 AA)
- [ ] Navegação integral por teclado (`Tab`, `Shift+Tab`, `Space`, `Enter`)
- [ ] Foco visível preservado em elementos interativos
- [ ] Skip links funcionais direcionando para conteúdo principal

### Assistente de IA Conversacional (RAG)
- [ ] Abertura e fechamento do terminal modal
- [ ] Resposta em PT ao consultar em português
- [ ] Resposta em EN ao selecionar idioma inglês
- [ ] Resiliência de modelo ativada sem falha 503 visível ao usuário

---

## Bloqueadores

> Se status = Reprovado, liste os bloqueadores antes de reenviar para revisão:

- [ ] [Nenhum]

---

## Status Final

| Campo              | Valor                                                  |
|--------------------|--------------------------------------------------------|
| **Decisão**        | ✅ Aprovado / ❌ Reprovado / ⚠️ Aprovado com Ressalvas |
| **Data**           |                                                        |
| **Assinado por**   |                                                        |
