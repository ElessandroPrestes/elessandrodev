# Perfil Operacional: QA & Validação

> Procedimentos para verificação de conformidade, build e testes manuais.

---

## 1. Roteiro de Testes de Regressão

1. **Abertura da Aplicação:**
   - Verificar console do navegador (esperado: 0 erros 404, 0 erros não tratados).
   - Verificar carregamento de todas as fontes (Space Grotesk, Inter, JetBrains Mono).
2. **Navegação:**
   - Clicar em cada item de navegação (`Projetos`, `Arquitetura`, `Trajetória`, `Habilidades`, `Contato`).
   - Verificar rolagem suave e posicionamento correto.
3. **Alternância de Tema:**
   - Alternar para Light Mode e Dark Mode.
   - Recarregar a página e garantir persistência da preferência.
4. **Alternância de Idioma:**
   - Alternar para EN e verificar se todos os títulos, textos e cards estão traduzidos.
   - Alternar para PT e verificar retorno correto.
5. **Terminal de IA Conversacional:**
   - Clicar em `// AI TERMINAL (RAG)`.
   - Enviar uma pergunta em português (ex: "Quais projetos com RabbitMQ?").
   - Verificar resposta contextualizada e sem erro 503.
   - Mudar idioma para EN, enviar pergunta em inglês e verificar resposta no idioma correto.
