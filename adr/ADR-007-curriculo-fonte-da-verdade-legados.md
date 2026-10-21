# ADR-007 — Currículo como Fonte da Verdade para Atribuição de Legados

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | ADR-007                                    |
| **Data**      | 2026-10-21                                 |
| **Autor**     | Elessandro Prestes Macedo                  |
| **Status**    | Aprovado                                   |
| **Decisores** | Elessandro Prestes Macedo (Product Owner)  |

---

## Contexto

A SPEC-004 (2026-10-08) fixou a diretriz de que a modernização de sistemas legados teria ocorrido somente na CAPES (SIPREC) e no Grupo Paraíso, negando explicitamente essa atribuição à EPM DEVTECH, ao ONS e à Energia Pecém.

O currículo atual e o prompt aprovado na SPEC-009 registram que, na EPM DEVTECH (Out/2025–Mai/2026), houve modernização do monólito legado para PHP 8.2/Laravel 12 com Strangler Fig e eliminação de mais de 56.400 linhas de código legado. Isso tornou a diretriz da SPEC-004 parcialmente divergente da fonte profissional vigente.

## Decisão

1. O currículo profissional e a ficha canônica do assistente prevalecem sobre o site e sobre o corpus RAG quando houver divergência factual.
2. A EPM DEVTECH passa a ser reconhecida como local de modernização de plataforma legada, incluindo o uso de Strangler Fig e a eliminação de mais de 56.400 linhas legadas.
3. Permanecem válidas as atribuições da CAPES (SIPREC) e do Grupo Paraíso (ERP têxtil), bem como a ausência de modernização de legados no ONS e na Energia Pecém.
4. A diretriz factual da SPEC-004 sobre a EPM DEVTECH fica substituída por esta ADR. Os demais pontos da SPEC-004 permanecem válidos.
5. Uma eventual atualização da copy do site para explicitar a modernização na EPM DEVTECH deve ocorrer em SPEC própria de conteúdo, sem expansão unilateral de escopo.

## Consequências

### Positivas

- Alinha o assistente à fonte profissional mais recente.
- Elimina respostas que negavam uma experiência registrada no currículo.
- Preserva a distinção entre empregador, cliente, modernização e atuação em alta criticidade.

### Negativas / Trade-offs

- A copy do site ainda pode omitir a modernização na EPM DEVTECH até uma revisão editorial dedicada.
- A SPEC-004 passa a ter uma diretriz parcialmente histórica, exigindo leitura conjunta com esta ADR.

## Referências

- `specs/SPEC-004-ajuste-atribuicao-legados.md`
- `specs/SPEC-009-prompt-assistente-fidelidade.md`
- `tasks/TASK-009-prompt-assistente-fidelidade.md`
- `knowledge/rag/10-experiencia.md`
- `src/i18n/locales/pt.js`
- `src/i18n/locales/en.js`
