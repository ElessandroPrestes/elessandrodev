# SPEC-016 — Degradação graciosa do assistente RAG

Status: aprovada pelo PO nesta sessão, com OpenRouter como primário e Workers AI como alternativa.

Escopo: Cloudflare Worker e interface do portfólio. Redis via Upstash REST para cache versionado, circuit breaker compartilhado e limite por visitante. O cache atende antes da geração. Em falha dos provedores, o Worker devolve trechos da busca existente. Em falha da busca ou ausência de resultados, oferece contato. A resposta identifica a origem em PT/EN. Warm-up executado por comando, com as consultas dos chips.

Critérios: somente gerações completas em cache; invalidação por revisão do índice; timeout e continuidade sem Redis; cooldown com uma sondagem concorrente; testes dos ramos e simulações locais. Cache semântico fica como proposta documental.
