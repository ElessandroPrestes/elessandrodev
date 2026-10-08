# Workflows Canônicos — elessandrodev

> Detalhamento de cada fluxo oficial de desenvolvimento no projeto.

---

## 1. Fluxo de Feature (Nova Funcionalidade)
Documentado na íntegra em [`workflows/feature.md`](../workflows/feature.md).
- Passo 1: SPEC Draft
- Passo 2: Aprovação PO
- Passo 3: Criação de TASK
- Passo 4: Implementação
- Passo 5: QA e Evidências
- Passo 6: Review e Docs
- Passo 7: Release

---

## 2. Fluxo de Bugfix (Correção de Defeito)
Documentado na íntegra em [`workflows/bugfix.md`](../workflows/bugfix.md).
- Evidência do erro.
- Análise de causa raiz.
- Correção pontual e blindagem.
- QA de regressão.

---

## 3. Fluxo de Refatoração Arquitetural
- Toda mudança que altere bibliotecas fundamentais ou padrões de projeto exige um **ADR** em `/adr/`.
- Discussão e alinhamento com o Arquiteto / PO antes de iniciar.
