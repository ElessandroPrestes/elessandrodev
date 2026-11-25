# ADR-013 — Redis e degradação graciosa no Worker RAG

**Status:** aprovada no escopo da SPEC-016.

## Contexto

O Cloudflare Worker atende um portfólio com cota de geração limitada. O cache
regional e o breaker em memória dificultam o reaproveitamento de respostas e a
coordenação entre instâncias.

## Decisão

Usar Upstash Redis por HTTPS com `fetch` nativo. Um prefixo por revisão do índice
isola o cache de respostas antigas. Dois scripts Lua atômicos controlam as
transições do breaker e o contador por visitante. O Worker consulta Redis com
timeout e segue com proteção local quando a dependência falha.

O OpenRouter continua como primário e Workers AI é configurável como alternativa.
A busca híbrida roda uma vez por miss elegível e fornece contexto de geração e
trechos para a contingência. Falha de embedding, falha na busca ou ausência de
resultados leva aos canais de contato.

## Consequências

O hit economiza tanto embeddings quanto geração. Redis adiciona latência às
requisições, limitada pelo timeout, e oferece coordenação enquanto está acessível.
O limiter do Worker protege a cota de geração, e buscas simplificadas continuam
consumindo embeddings. A contingência local perde consistência entre instâncias.
Cache em memória e Workers KV foram avaliados e não oferecem a coordenação
atômica exigida. Redis em Docker demandaria uma implantação de rede adicional.
