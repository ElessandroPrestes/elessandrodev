# Arquitetura do Sistema — elessandrodev

> Visão arquitetural completa do projeto `elessandrodev`.

---

## 1. Topologia da Solução

```
[Navegador / Visitante]
         │
         ├───► GitHub Pages (Hospedagem Estática de Alta Velocidade)
         │         │
         │         ├─── index.html
         │         ├─── Assets JS & CSS compilados pelo Vite
         │         └─── Favicon & PDFs estáticos
         │
         └───► Google Generative Language API (Gemini LLM)
                   ▲
                   │ (Chamadas Diretas via LangChain.js)
                   ▼
               Respostas em Streaming / JSON
```

---

## 2. Decisões Arquiteturais Fundamentais

1. **SPA Estática sem Backend Server-Side:** Toda a aplicação é servida como artefato estático pelo GitHub Pages, reduzindo custos a zero e garantindo altíssima disponibilidade global.
2. **LangChain no Frontend com Chave de API de Demonstração:** Permite que o visitante experimente um terminal interativo de IA sem necessidade de infraestrutura de servidor backend adicional.
3. **Multi-Model Resilient Fallback:** O serviço de IA implementa rotação dinâmica de modelos para evitar indisponibilidades comuns de picos de carga (503 Service Unavailable) em modelos experimentais ou muito requisitados.
4. **Composables Nativos:** Gerenciamento de tema e internacionalização sem complexidade de stores globais, mantendo o bundle leve e rápido.
