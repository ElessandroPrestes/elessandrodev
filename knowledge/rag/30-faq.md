# Perguntas Frequentes e Notas de Domínio

## ONS e Energia Pecém são a mesma organização?

Não. ONS (Operador Nacional do Sistema Elétrico) e Energia Pecém (Usina Termelétrica Energia Pecém) são entidades distintas e foram experiências profissionais separadas, ambas no setor elétrico brasileiro.

- **ONS:** órgão responsável pela coordenação e controle da operação das instalações de geração e transmissão do Sistema Interligado Nacional (SIN), sob regulação da Aneel. A atuação de Elessandro foi via consultoria AMcom, no Projeto GENIN.
- **Energia Pecém:** usina termelétrica de geração de energia. A atuação foi no Projeto SIGMA.

As duas organizações nunca devem ser tratadas como o mesmo local de trabalho.

Termos relacionados: energy sector, electricity sector, power generation, energy companies, utilities, ONS, Energia Pecém.

## Onde houve modernização de sistemas legados?

A modernização de sistemas legados ocorreu na EPM DEVTECH, na CAPES e no Grupo Paraíso.

- **EPM DEVTECH:** liderou a modernização da plataforma monolítica legada para PHP 8.2 e Laravel 12 com Strangler Fig, eliminando mais de 56.400 linhas de código legado.
- **CAPES (Projeto SIPREC):** coarquitetou e executou a modernização do sistema monolítico legado de avaliação para microsserviços e BFF em Angular.
- **Grupo Paraíso:** colaborou em iniciativas de migração gradual do ERP monolítico legado da indústria têxtil para microsserviços em Node.js, usando Strangler Fig Pattern.

O ONS e a Energia Pecém não envolveram modernização de sistemas legados.

Termos relacionados: legacy system modernization, legacy systems, monolith modernization, Strangler Fig Pattern.

## Como entrar em contato?

- **LinkedIn:** https://www.linkedin.com/in/elessandro-prestes-macedo/
- **E-mail:** elessandrodev@gmail.com
- **WhatsApp:** +55 (45) 99917-8290
- **GitHub:** https://github.com/ElessandroPrestes
- **GitLab:** https://gitlab.com/elessandrodev

Termos relacionados: contact, professional contact, email, LinkedIn, WhatsApp.

## O currículo está disponível em PDF?

Sim. O portfólio disponibiliza duas versões para download:

- Currículo em inglês: `Elessandro_Prestes_Macedo_Software_Engineer.pdf`.
- Currículo em português: `Elessandro_Prestes_Macedo_Engenheiro_de_Software.pdf`.

Os arquivos ficam na pasta pública do site e podem ser baixados pela interface do portfólio.

Termos relacionados: resume, CV, curriculum, PDF, download.

## Como o assistente deste portfólio usa RAG?

O assistente usa RAG real, não apenas injeção de contexto.

1. O currículo e os projetos são mantidos em Markdown, divididos por seção.
2. Cada seção é convertida em embeddings multilíngues.
3. Os vetores são armazenados em um índice versionado.
4. A pergunta do visitante é convertida em embedding com o mesmo modelo.
5. O sistema calcula similaridade de cosseno e recupera os trechos mais relevantes.
6. Se nenhum trecho atingir o limite mínimo de relevância, o assistente informa que não há essa informação no currículo, sem chamar o modelo de linguagem.
7. Quando há evidência, o modelo responde apenas com base nos trechos recuperados e cita as fontes.

A chave do provedor de LLM fica em um Cloudflare Worker, nunca no navegador.

Termos relacionados: RAG, retrieval augmented generation, embeddings, vector search, portfolio assistant, hallucinations, citations.

## Qual é a disponibilidade para novos projetos?

Elessandro está disponível para novos projetos, em modelo remoto ou híbrido.

Termos relacionados: availability, new projects, remote, hybrid.

## Experiência com liderança técnica

Sim. Atuou como Tech Lead na CAPES/SISCAD, liderando evolução técnica e mentoria, e como Líder Técnico na EPM DEVTECH, com planejamento e arquitetura de plataformas web, definição de APIs e consultoria em arquitetura de software.

Termos relacionados: technical leadership, tech lead, engineering leadership, mentoring.

## Setores de atuação

Educação, energia elétrica, indústria têxtil, serviços e plataformas corporativas. Entre as organizações atendidas estão CAPES, ONS, Energia Pecém, Grupo Intellectus e Grupo Paraíso.

Termos relacionados: industries, sectors, energy, education, textile, utilities, companies.

## Como a IA é usada no ciclo de desenvolvimento?

Com SDD (Spec-Driven Development), RAG, MCP e assistentes de código como Claude Code, GitHub Copilot e Codex. O objetivo é formalizar especificações, validar requisitos, manter rastreabilidade e reduzir retrabalho, sempre com revisão humana e escopo delimitado.

Termos relacionados: AI-assisted development, SDD, RAG, MCP, code assistants.

## Tecnologias não listadas no currículo

O currículo lista PHP (Laravel, Symfony), Node.js (Express, NestJS), TypeScript, JavaScript, Angular, Vue.js, React, bancos SQL e NoSQL, Docker, Kubernetes, AWS e Azure. Tecnologias como Python, Java, C#, Go, Rust, .NET e Terraform não constam no currículo. Isso não significa que Elessandro as desconheça; significa apenas que não há registro profissional documentado nessas stacks.
