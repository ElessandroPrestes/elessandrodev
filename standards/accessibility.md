# Padrões de Acessibilidade (a11y) — elessandrodev

> Requisitos obrigatórios de acessibilidade alinhados às diretrizes **WCAG 2.1 nível AA**.

---

## 1. Princípios de Acessibilidade

Todo visitante deve ser capaz de perceber, compreender, navegar e interagir com o portfólio independentemente de tecnologia assistiva, dispositivo ou preferência sensorial.

---

## 2. Requisitos Técnicos

### 2.1 Navegação por Teclado
- Todos os controles interativos (`<a>`, `<button>`, `<input>`) devem ser alcançáveis via tecla `Tab`.
- A ordem do foco deve acompanhar a lógica visual e semântica do documento.
- O foco nunca pode ser preso (*keyboard trap*).

### 2.2 Foco Visível
- Todo elemento focado deve apresentar anel de foco bem delineado:
  `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`.

### 2.3 Skip Link
- O topo da página deve incluir link de atalho acessível ("Pular para o conteúdo principal" / "Skip to main content") visível imediatamente ao primeiro toque de `Tab`.

### 2.4 Semântica HTML & ARIA
- Uso estrito de tags HTML5 semânticas: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- Botões que abrem modais ou terminais devem conter `aria-expanded` e `aria-label` descritivos.
- SVGs informativos devem conter rótulo acessível ou `aria-hidden="true"` quando puramente decorativos.

### 2.5 Contraste de Cores
- Texto normal: razão de contraste mínima de **4.5:1** contra o fundo.
- Texto grande (≥ 18pt ou ≥ 14pt bold): razão mínima de **3:1**.
- Componentes de interface e bordas essenciais: razão mínima de **3:1**.
