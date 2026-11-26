# SPEC-017 — Stale-if-error no cache do assistente RAG

Status: aprovada explicitamente pelo PO em 26/11/2026.

Contexto: A SPEC-016 usa Upstash Redis para servir gerações completas com fontes. O TTL atual remove a entrada após 24 h. Uma pergunta repetida passa a depender de embeddings e geração assim que esse prazo termina. Falhas e cotas dos modelos gratuitos podem deixar o visitante apenas com trechos do currículo ou canais de contato.

Escopo: Cloudflare Worker, cliente e componente de chat Vue, textos PT-BR/EN, testes e documentação. Usar a branch `release/degradacao-rag-spec-016`. Backend Node, Kubernetes, secrets e deploy ficam fora do escopo. Alterar o script de aquecimento somente se o novo contrato exigir.

Decisão: Manter a chave por revisão do índice, idioma e pergunta normalizada. Preservar o formato persistido `{ response, sources, origin, provider, timestamp }`, com `timestamp` ISO representando o instante da geração. A revisão continua na chave. Entradas existentes ainda disponíveis são lidas no mesmo formato e mantêm o vencimento já registrado no Redis. Entradas expiradas pelo Redis não são recuperáveis. Apenas uma nova geração completa com fontes grava ou substitui uma entrada.

Contrato:

- `CACHE_TTL_SECONDS` define a janela fresca e mantém o padrão de 86.400 s (24 h). `CACHE_HARD_TTL_SECONDS` define a retenção física aplicada com `SET ... EX`, com padrão de 604.800 s (7 dias). Se a janela fresca configurada exceder a retenção, limitar a janela fresca à retenção efetiva.
- **FRESH** significa idade até o limite fresco, inclusive. Retorna HTTP 200 com `HIT` antes do limite por visitante, dos embeddings e da geração. **STALE** significa idade acima do limite fresco e até o limite duro, inclusive, enquanto a entrada estiver disponível no Redis. Fica reservada para contingência. **MISS** inclui ausência, entrada inválida ou idade além do limite duro.
- Após o atalho de contato e a leitura de cache, o limite por visitante esgotado serve stale diretamente se houver entrada elegível. Sem essa entrada, mantém o fluxo de retrieval e sua degradação atual.
- Com retrieval disponível e geração permitida, tentar OpenRouter e depois Workers AI conforme o fluxo atual. Um breaker aberto pula apenas OpenRouter. Se Workers AI responder, devolver a resposta ao vivo e renovar a entrada quando elegível para gravação. Se nenhum provedor responder, preferir stale e então os trechos recuperados.
- Se embeddings ou retrieval falharem ou a busca voltar vazia, preferir stale e então oferecer contato. Sem acesso ao Redis, preservar o fluxo atual e tentar gerar quando possível. Se a geração também falhar, servir trechos quando disponíveis e oferecer contato quando a busca falhar ou estiver vazia.
- Resposta stale usa HTTP 200, `X-Assistant-Cache: STALE`, `origin: "stale-cache"` e `cachedAt` com o ISO original da geração. Preserva o texto e as fontes gravados. Servir stale nunca grava, renova ou prolonga a entrada. A elegibilidade respeita o limite duro no momento de servir.
- Mudança de revisão invalida inclusive stale. Respostas de erro, trechos e contato não entram no cache de respostas. Um eventual cache negativo não pode substituir uma entrada positiva.
- A interface mostra aviso discreto apenas para `origin: "stale-cache"`, via i18n. PT-BR: “Resposta salva anteriormente (o serviço de IA está instável)”. EN: “Previously saved answer (the AI service is unstable).”

Critérios:

1. Hit fresco preserva o contrato atual sem chamar limiter, embeddings ou geração. Testes exercitam os limites fresco e duro e tratam como miss uma entrada além da retenção.
2. Entrada stale e geração completa devolvem a resposta nova e renovam timestamp e TTL duro. Uma resposta stale preserva texto, fontes e timestamp original, expõe o header e os campos do contrato e não efetua gravação.
3. Com entrada stale elegível, 429, 5xx ou timeout da cadeia de geração resultam em stale quando nenhum provedor responde. Com breaker aberto, OpenRouter é pulada e Workers AI ainda é tentado. O resultado de Workers AI determina se a resposta será ao vivo ou stale.
4. Com limite por visitante esgotado e entrada stale, a resposta salva é servida sem embeddings nem chamada a provedor de geração. Falha de embeddings, falha de retrieval e busca vazia servem stale antes do contato.
5. Ausência, revisão diferente ou retenção excedida preservam a degradação existente. Falha de Redis permite resposta ao vivo se a geração funcionar e trechos se a geração falhar com retrieval disponível. Erros, trechos e contato não são gravados como respostas reutilizáveis.
6. A origem e o aviso do frontend são verificados em PT-BR e inglês. Hit fresco, resposta ao vivo, trechos e contato não mostram o aviso de stale.
7. Registrar em QA-017 os resultados de `npm test`, `npm run rag:check` e `npm run build`, comparados com a baseline de 56 testes aprovados da branch `6fa93a0`. Documentar a cadeia de degradação no README e registrar os limites da verificação local, incluindo Redis real, produção e tráfego real.
