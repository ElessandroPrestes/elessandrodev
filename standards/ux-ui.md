# Padrões de UX/UI — elessandrodev

> Critérios de experiência do usuário e interface visual baseados no Design System editorial do projeto.

---

## 1. Princípios de Design

1. **Estética Editorial Técnica:** O layout inspira-se em editoriais de tecnologia e relatórios de engenharia de alta fidelidade. Tipografia balanceada, espaçamentos generosos e hierarquia cristalina.
2. **Mobile First:** Todo componente deve ser concebido e validado primeiramente nas menores larguras de tela (320px / 375px) e expandir organicamente para desktop.
3. **Contraste & Sobriedade:** Cores de fundo sólidas com toques sutis de transparência e blur (`backdrop-blur-md`). Cores de realce usadas cirurgicamente (Indigo para links e foco, Emerald para status operacional).
4. **Respeito ao Usuário:** Sem pop-ups invasivos, animações excessivas ou elementos que causem distração ou vertigem.

---

## 2. Tipografia

- **Títulos e Destaques:** Space Grotesk (`font-display`) — moderna, precisa e com caráter de engenharia.
- **Corpo e Textos:** Inter (`font-sans`) — legibilidade superior em qualquer tamanho de fonte.
- **Código e Dados Técnicos:** JetBrains Mono (`font-mono`) — monoespaçada com numerais alinhados e ligaduras para identificadores técnicos.

---

## 3. Paleta de Cores e Temas

### Modo Escuro (Dark Mode — Padrão Recomendado)
- Superfície Principal: `#0a0b0e` / `bg-[#0a0b0e]`
- Cartões e Painéis: `bg-[#12141a]` ou `bg-slate-900/60`
- Bordas: `border-neutral-800` / `border-slate-800`
- Texto Principal: `text-white` / `text-neutral-100`
- Texto Secundário: `text-neutral-400` / `text-slate-400`

### Modo Claro (Light Mode)
- Superfície Principal: `#fbfbfb` / `bg-[#fbfbfb]`
- Cartões e Painéis: `bg-white`
- Bordas: `border-slate-200`
- Texto Principal: `text-slate-900`
- Texto Secundário: `text-slate-500`

### Acentos
- Acento de Interação: Indigo (`text-indigo-600` no claro, `text-indigo-400` no escuro)
- Acento de Operação: Emerald (`bg-emerald-500`, `text-emerald-400`)
