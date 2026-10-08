# Design System & Tokens — elessandrodev

> Especificação técnica de tokens, componentes e governança visual do projeto.

---

## 1. Tokens de Espaçamento e Layout

- Container máximo canônico: `max-w-6xl` centralizado com padding responsivo (`px-4 sm:px-8`).
- Espaçamento vertical entre seções: `py-16 sm:py-24`.
- Grid responsivo padrão: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8`.

---

## 2. Componentes e Estados

### Botões e Links Interativos
- Devem conter feedback de hover e active evidente.
- Devem possuir classes de foco acessível: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`.
- Devem respeitar tempo de transição suave: `transition-colors duration-150` ou `transition-all`.

### Painéis de Conteúdo (Cards)
- Cantos arredondados: `rounded-lg` ou `rounded-xl`.
- Bordas sutis em ambos os temas.
- Efeito hover: sutil elevação ou iluminação de borda (`hover:border-indigo-500/50`).

### Terminal Flutuante de IA
- Posição: fixo no canto inferior direito (`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999]`).
- Visual estilo terminal dark em ambos os temas, com cabeçalho de controle de janela (botões estilo macOS/Unix).
- Scrollbar personalizada no chat.
