<script setup>
const experiences = [
  {
    role: 'Engenheiro de Software com IA Aplicada',
    company: 'EPM DEVTECH',
    project: null,
    period: 'Out/2025 - Mai/2026',
    highlights: [
      { label: 'Modernização e Migração de Sistema', text: 'Liderei a modernização da plataforma monolítica legada para PHP 8.2 e Laravel 12 aplicando o Strangler Fig Pattern, eliminando mais de 56.400 linhas de código legado e preparando a base para uma evolução escalável.' },
      { label: 'Testes Automatizados & Qualidade', text: 'Estruturei 2.399 testes automatizados em 241 arquivos com Pest/PHPUnit, aplicando SOLID e Clean Code para elevar a qualidade e a confiabilidade do software.' },
      { label: 'APIs, Migrations & Automação', text: 'Evoluí a plataforma para 384 rotas/endpoints REST e 181 migrations, desenvolvendo integrações com WhatsApp Business e automações que reduziram atividades manuais em 35%.' },
      { label: 'Arquitetura & Redução de Retrabalho', text: 'Reduzi o retrabalho em 40% através de Software Architecture, testes automatizados, documentação técnica e esteiras CI/CD com Docker e GitLab.' },
      { label: 'IA Aplicada & SDD', text: 'Aumentei a produtividade e a rastreabilidade aplicando a metodologia Spec-Driven Development (SDD) e Engenharia de Software Assistida por IA com Claude Code, GitHub Copilot, Codex, RAG e MCP.' },
    ],
    techs: ['PHP 8.2+', 'Laravel 12', 'Strangler Fig Pattern', 'Claude Code (SDD)', 'Pest/PHPUnit', 'Docker', 'GitLab CI/CD', 'REST APIs', 'Clean Code'],
  },
  {
    role: 'Analista Programador / Tech Lead',
    company: 'Datainfo',
    project: 'Projeto CAPES',
    period: 'Out/2024 - Set/2025',
    highlights: [
      { label: 'Modernização Arquitetural (SIPREC / CAPES)', text: 'Coarquitei e executei a modernização da plataforma SIPREC para 448+ IES (UAB e AUXPE), aplicando o Strangler Fig Pattern para migrar para microsserviços e BFF (Angular), suportando picos de 10.000 usuários simultâneos, 2.500 RPS e latência média abaixo de 300ms.' },
      { label: 'Liderança Técnica (SISCAD / CAPES)', text: 'Liderei e executei do zero o desenvolvimento do SISCAD como Tech Lead e desenvolvedor, automatizando a gestão de milhares de processos de cobrança administrativa e acordos de parcelamento via PHP (Laravel), Oracle DB, Redis e mensageria com RabbitMQ.' },
      { label: 'DevOps & Confiabilidade', text: 'Aumentei a confiabilidade operacional e reduzi falhas em produção gerenciando a infraestrutura e os processos de deploy de ambientes críticos com Docker, GitLab CI/CD e práticas DevOps.' },
      { label: 'Garantia de Qualidade & SonarQube', text: 'Elevei os indicadores de qualidade de código em 45% e reduzi vulnerabilidades críticas implementando análise estática contínua via SonarQube.' },
      { label: 'Produtividade & Mentoria com IA', text: 'Aumentei em 25% a entrega de features por sprint liderando a implementação do GitHub Copilot integrado ao SDD junto à equipe através de mentoria técnica e padronização de especificações.' },
    ],
    techs: ['PHP', 'Laravel', 'Angular', 'Microservices', 'BFF', 'Oracle DB', 'Redis', 'RabbitMQ', 'SonarQube', 'Docker', 'GitLab CI/CD', 'SDD', 'RAG', 'MCP'],
  },
  {
    role: 'Desenvolvedor Full Stack',
    company: 'Energia Pecém',
    project: null,
    period: 'Mai/2023 - Jul/2024',
    highlights: [
      { label: 'Projeto SIGMA – Rastreabilidade Operacional', text: 'Aumentei a rastreabilidade operacional em 40%, desenvolvendo soluções de validação e acompanhamento de equipamentos em tempo real com Node.js, Laravel, Vue.js e PostgreSQL.' },
      { label: 'Gestão de Dados & Estado em Tempo Real', text: 'Reduzi falhas operacionais em 35% e elevei a consistência de dados em toda a plataforma projetando fluxos de sincronização e gerenciamento de estado em tempo real com Redis.' },
      { label: 'Arquitetura Assíncrona (EDA)', text: 'Elevei a capacidade de processamento em 50% e eliminei gargalos operacionais projetando uma arquitetura assíncrona e resiliente orientada a eventos (EDA) com RabbitMQ e Laravel Jobs.' },
      { label: 'Monitoramento Cloud & Observabilidade', text: 'Reduzi incidentes críticos em produção em 45% e acelerei o MTTR implementando monitoramento preditivo e observabilidade via Azure Monitor e Azure Communication Services.' },
      { label: 'Disponibilidade & Alta Escalabilidade', text: 'Garanti 99,9% de disponibilidade (uptime) da plataforma evoluindo a arquitetura com foco em alta escalabilidade, desacoplamento e suporte ao crescimento contínuo da operação.' },
    ],
    techs: ['Node.js', 'Laravel', 'Vue.js', 'PostgreSQL', 'Redis', 'RabbitMQ', 'Event-Driven Architecture', 'Azure Monitor', 'Azure Communication Services'],
  },
  {
    role: 'Desenvolvedor de Sistemas',
    company: 'AMcom',
    project: 'Projeto GENIN - ONS',
    period: 'Jul/2022 - Abr/2023',
    highlights: [
      { label: 'Integrações Nacionais & Bandeira Tarifária', text: 'Viabilizei o cálculo de métricas para a alteração da bandeira tarifária nacional no Projeto Genin com 100% de integridade e zero perda de dados na consolidação regulatória, através de integrações de missão crítica com Itaipu e INMET via PHP (Laravel), REST e SOAP.' },
      { label: 'Processamento Real-Time & Baixa Latência', text: 'Atuei na definição da arquitetura em tempo real de dados energéticos e climáticos em escala nacional, reduzindo a latência na ingestão de dados em 40% através de microsserviços desacoplados com PostgreSQL e Redis.' },
      { label: 'Infraestrutura AWS & Automação CI/CD', text: 'Automatizei a infraestrutura e a esteira de entrega contínua na AWS, reduzindo o tempo de deploy em 60% e assegurando 99,9% de disponibilidade dos serviços com pipelines em CodeBuild, orquestração via API Gateway e CloudWatch.' },
    ],
    techs: ['PHP', 'Laravel', 'REST/SOAP', 'PostgreSQL', 'Redis', 'AWS CodeBuild', 'Amazon API Gateway', 'Amazon CloudWatch', 'Microservices'],
  },
  {
    role: 'Desenvolvedor Full Stack',
    company: 'Grupo Intellectus',
    project: 'Projeto Educacional – SEDUC-MT',
    period: 'Out/2021 - Jul/2022',
    highlights: [
      { label: 'Arquitetura Serverless na AWS', text: 'Atuei no desenho da arquitetura e desenvolvi a plataforma de Xadrez Online em Serverless Architecture na AWS, reduzindo em 35% os custos e garantindo escalabilidade automática via AWS Lambda, SQS e SNS.' },
      { label: 'Escala Pública Educacional (SEDUC-MT)', text: 'Desenvolvi e integrei a plataforma para mais de 650 escolas estaduais em 141 municípios de Mato Grosso, conectando a solução aos sistemas da SEDUC-MT através de Angular no frontend e APIs em PHP (Laravel) no backend com 99,9% de uptime.' },
      { label: 'Observabilidade & Diagnóstico (MTTR)', text: 'Estruturei a camada de observabilidade e centralização de logs com ELK Stack, reduzindo em 50% o tempo médio de diagnóstico de incidentes (MTTR) da plataforma.' },
      { label: 'CI/CD & Automação de Entregas', text: 'Acelerei o ciclo de entrega de novas funcionalidades em 60%, automatizando as esteiras de integração e entrega contínua via GitHub Actions com validações automatizadas de código.' },
      { label: 'System Design & Disponibilidade', text: 'Assegurei 99,9% de disponibilidade durante picos de acesso simultâneo colaborando em soluções de System Design focadas em baixa latência, resiliência e desacoplamento de serviços.' },
    ],
    techs: ['AWS Lambda', 'Amazon SQS', 'Amazon SNS', 'Angular', 'PHP', 'Laravel', 'ELK Stack', 'GitHub Actions', 'Serverless'],
  },
  {
    role: 'Desenvolvedor Full Stack',
    company: 'Paraiso',
    project: null,
    period: 'Ago/2016 - Set/2021',
    highlights: [
      { label: 'Modernização de ERP Corporativo', text: 'Contribuí para o aumento de 30% na eficiência operacional das áreas financeira, logística e industrial, atuando no desenvolvimento e evolução de módulos estratégicos de ERP corporativo com PHP (Laravel, Symfony), PostgreSQL e Oracle.' },
      { label: 'Modernização de Legados & Strangler Fig Pattern', text: 'Colaborei na redução de 40% nos custos de manutenção de software, participando de iniciativas de migração de sistemas monolíticos legados para uma arquitetura de microsserviços e sistemas distribuídos com Node.js, utilizando o Strangler Fig Pattern para viabilizar a evolução gradual sem impactar a operação.' },
      { label: 'IoT Industrial & Azure Cloud', text: 'Ajudei a reduzir em 30% as falhas operacionais e humanas, participando da implementação de integrações de IoT Industrial no ecossistema Azure Cloud para conectar equipamentos de produção aos sistemas corporativos.' },
      { label: 'Comunicação em Tempo Real & WebSockets', text: 'Contribuí para a otimização e baixa latência na sincronização de dados, desenvolvendo soluções de comunicação bi-direcional em tempo real baseadas em WebSockets.' },
      { label: 'Arquitetura Orientada a Eventos (EDA na AWS)', text: 'Colaborei para assegurar 99,9% de disponibilidade, coarquitetando soluções escaláveis na AWS orientadas a eventos (Event-Driven Architecture) com Kafka, RabbitMQ, Redis e PostgreSQL.' },
      { label: 'Qualidade de Engenharia & Boas Práticas', text: 'Promovi junto ao time a elevação da qualidade e manutenibilidade dos sistemas, aplicando padrões como SOLID, Clean Architecture, TDD e arquitetura orientada a eventos.' },
    ],
    techs: ['PHP', 'Symfony', 'Laravel', 'Node.js', 'Strangler Fig Pattern', 'IoT Industrial', 'Azure Cloud', 'AWS', 'Apache Kafka', 'RabbitMQ', 'PostgreSQL', 'Oracle DB', 'WebSockets', 'TDD'],
  },
]
</script>

<template>
  <section aria-labelledby="experience-heading" class="max-w-3xl mx-auto w-full">
    <h2
      id="experience-heading"
      class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-10"
    >
      Experiência Profissional
    </h2>

    <ol class="relative border-l border-gray-800 space-y-0">
      <li
        v-for="(exp, index) in experiences"
        :key="index"
        class="relative pl-8 pb-12 last:pb-0"
      >
        <!-- Marcador da timeline -->
        <span
          class="absolute left-0 -translate-x-1/2 mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 ring-4 ring-gray-950"
          aria-hidden="true"
        />

        <article class="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">

          <!-- Topo: período + empresa -->
          <header class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-4">
            <div>
              <h3 class="text-base font-semibold text-white leading-snug">
                {{ exp.role }}
              </h3>
              <p class="text-sm font-medium text-indigo-400 mt-0.5">
                {{ exp.company }}
                <span v-if="exp.project" class="text-gray-400 font-normal">
                  - {{ exp.project }}
                </span>
              </p>
            </div>
            <time class="shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide sm:text-right mt-0.5">
              {{ exp.period }}
            </time>
          </header>

          <!-- Lista de tópicos -->
          <ul class="space-y-2.5 mb-5" role="list">
            <li
              v-for="(item, i) in exp.highlights"
              :key="i"
              class="flex gap-2.5 text-sm text-gray-400 leading-relaxed"
            >
              <span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
              <span>
                <strong class="text-gray-200 font-medium">{{ item.label }}:</strong>
                {{ item.text }}
              </span>
            </li>
          </ul>

          <!-- Badges de tecnologias -->
          <ul
            class="flex flex-wrap gap-2"
            :aria-label="`Tecnologias utilizadas em ${exp.company}`"
          >
            <li v-for="tech in exp.techs" :key="tech">
              <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                {{ tech }}
              </span>
            </li>
          </ul>

        </article>
      </li>
    </ol>
  </section>
</template>
