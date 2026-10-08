# ADR-004 — Internacionalização Reativa Leve via Composable useI18n

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | ADR-004                                    |
| **Data**      | 2026-08-19                                 |
| **Autor**     | Elessandro Prestes Macedo                  |
| **Status**    | Aprovado                                   |
| **Decisores** | Elessandro Prestes Macedo                  |

---

## Contexto
O portfólio atende tanto ao mercado brasileiro quanto a empresas internacionais e recrutadores globais, exigindo suporte bilíngue (Português do Brasil e Inglês). Bibliotecas como `vue-i18n` introduzem overhead de bundle e sintaxe complexa para uma SPA de página única.

## Decisão
Implementar um composable nativo `useI18n.js` com dicionários estáticos (`pt.js` e `en.js`) e reatividade Vue pura (`ref` e `computed`), persistindo a preferência em `localStorage`.

## Consequências
### Positivas
- Zero dependências externas adicionadas ao bundle.
- Alternância instantânea de idioma sem render flash.
- Estrutura de dados simples e tipável.
