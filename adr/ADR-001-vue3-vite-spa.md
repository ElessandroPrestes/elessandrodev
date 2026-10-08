# ADR-001 — Adoção de Vue.js 3 e Vite para Single Page Application

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | ADR-001                                    |
| **Data**      | 2026-08-15                                 |
| **Autor**     | Elessandro Prestes Macedo                  |
| **Status**    | Aprovado                                   |
| **Decisores** | Elessandro Prestes Macedo                  |

---

## Contexto
O portfólio profissional requer velocidade instantânea de carregamento, consumo levíssimo de memória e facilidade para hospedar como artefato estático no GitHub Pages sem requisições a servidores backend intermediários.

## Decisão
Adotar Vue.js 3 com Composition API (`<script setup>`) e Vite como ferramenta de build e dev server.

## Consequências
### Positivas
- Carregamento inicial ultrarrápido (< 1s).
- Build otimizado via Rollup.
- Facilidade de deploy contínuo estático via GitHub Actions.

### Negativas / Trade-offs
- Ausência de SSR (Server-Side Rendering) tradicional, suprida por meta-tags e SEO estático no `index.html`.
