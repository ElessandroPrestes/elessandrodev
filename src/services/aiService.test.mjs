import assert from 'node:assert';
import { isTransientError, calculateBackoff } from '../config/aiConfig.js';
import fs from 'node:fs';

let key = process.env.VITE_GEMINI_API_KEY;
if (!key && fs.existsSync('.env')) {
  try {
    const env = fs.readFileSync('.env', 'utf8');
    key = env.match(/VITE_GEMINI_API_KEY=(.*)/)?.[1]?.trim();
  } catch {
    // Silently fall back if .env is unreadable
  }
}
process.env.VITE_GEMINI_API_KEY = key || 'ci-test-key';

console.log('=== SUÍTE DE TESTES: RESILIÊNCIA E STREAMING DO CHAT (Universal SDD) ===\n');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASSOU] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FALHOU] ${description}:`, err.message);
  }
}

async function itAsync(description, asyncFn) {
  totalTests++;
  try {
    await asyncFn();
    console.log(`✅ [PASSOU] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FALHOU] ${description}:`, err.message);
  }
}

// 1. Testes de Classificação de Erros Transitórios vs Permanentes
it('Cenário E.1: Identifica 401 como erro permanente (não transitório)', () => {
  const err = new Error('[401 Unauthorized] API key not valid');
  err.status = 401;
  assert.strictEqual(isTransientError(err), false);
});

it('Cenário E.2: Identifica 404 como erro permanente (não transitório)', () => {
  const err = new Error('models/invalid-model is not found [404]');
  err.status = 404;
  assert.strictEqual(isTransientError(err), false);
});

it('Cenário B.1: Identifica 503 como transitório (passível de retry)', () => {
  const err = new Error('This model is currently experiencing high demand [503]');
  err.status = 503;
  assert.strictEqual(isTransientError(err), true);
});

it('Cenário B.2: Identifica 429 como transitório (rate limit)', () => {
  const err = new Error('Resource exhausted [429]');
  err.status = 429;
  assert.strictEqual(isTransientError(err), true);
});

it('Cenário B.3: Identifica Timeout e Network Error como transitórios', () => {
  const timeoutErr = new Error('Timeout exceeded');
  timeoutErr.name = 'TimeoutError';
  const networkErr = new Error('Failed to fetch');
  assert.strictEqual(isTransientError(timeoutErr), true);
  assert.strictEqual(isTransientError(networkErr), true);
});

// 2. Testes de Backoff com Jitter
it('Calcula backoff exponencial com jitter bounded', () => {
  const b1 = calculateBackoff(1, 100);
  const b2 = calculateBackoff(2, 100);
  const b3 = calculateBackoff(3, 100);

  assert.ok(b1 >= 100 && b1 <= 300, `b1=${b1}`);
  assert.ok(b2 >= 200 && b2 <= 400, `b2=${b2}`);
  assert.ok(b3 >= 400 && b3 <= 600, `b3=${b3}`);
});

// 3. Testes Funcionais da Orquestração de Streaming e Fallback
// Mock da lógica interna para simular cenários A a F de forma determinística
async function simulateStreamOrchestration({
  primaryFailsCount = 0,
  primaryErrorCode = 503,
  fallbackFailsCount = 0,
  failAfterToken = false,
  maxRetries = 2,
}) {
  let primaryAttempts = 0;
  let fallbackAttempts = 0;
  let fallbackUsed = false;
  const statuses = [];
  const tokens = [];
  let hasEmittedFirstToken = false;
  let fullText = '';

  const tiers = [
    { name: 'primary', maxRetries: maxRetries, isFallback: false },
    { name: 'fallback', maxRetries: 1, isFallback: true },
  ];

  for (const tier of tiers) {
    if (tier.isFallback) {
      fallbackUsed = true;
      statuses.push('fallback_activated');
    }

    let attempt = 0;
    while (attempt <= tier.maxRetries) {
      attempt++;
      if (tier.name === 'primary') primaryAttempts++;
      if (tier.name === 'fallback') fallbackAttempts++;

      try {
        if (tier.name === 'primary' && primaryAttempts <= primaryFailsCount) {
          const err = new Error(`Simulated error ${primaryErrorCode}`);
          err.status = primaryErrorCode;
          throw err;
        }

        if (tier.name === 'fallback' && fallbackAttempts <= fallbackFailsCount) {
          const err = new Error('Simulated fallback 503');
          err.status = 503;
          throw err;
        }

        // Simula streaming de tokens
        const mockChunks = ['Olá, ', 'mundo!'];
        for (const chunk of mockChunks) {
          if (!hasEmittedFirstToken) {
            hasEmittedFirstToken = true;
          }
          if (failAfterToken && hasEmittedFirstToken && chunk === 'mundo!') {
            const interruptErr = new Error('Network dropped during stream');
            throw interruptErr;
          }
          tokens.push(chunk);
          fullText += chunk;
        }

        return { fullText, primaryAttempts, fallbackAttempts, fallbackUsed, statuses };
      } catch (err) {
        if (hasEmittedFirstToken) {
          const errInterrupted = new Error('A resposta foi interrompida.');
          errInterrupted.hasPartialOutput = true;
          errInterrupted.partialText = fullText;
          throw errInterrupted;
        }

        const isTransient = isTransientError(err);
        if (!isTransient) {
          throw err; // Erro permanente, não faz retry
        }

        if (attempt <= tier.maxRetries) {
          statuses.push('retry_scheduled');
        } else {
          break; // Esgotou retries do modelo atual
        }
      }
    }
  }

  throw new Error('Todos os modelos falharam');
}

// Cenário A: Sucesso direto (Gemini -> 200)
await itAsync('Cenário A: Sucesso direto sem retries ou fallback', async () => {
  const res = await simulateStreamOrchestration({ primaryFailsCount: 0 });
  assert.strictEqual(res.fullText, 'Olá, mundo!');
  assert.strictEqual(res.primaryAttempts, 1);
  assert.strictEqual(res.fallbackUsed, false);
});

// Cenário B: 503 -> Sucesso no retry
await itAsync('Cenário B: 503 transitório recuperado no retry', async () => {
  const res = await simulateStreamOrchestration({ primaryFailsCount: 1 });
  assert.strictEqual(res.fullText, 'Olá, mundo!');
  assert.strictEqual(res.primaryAttempts, 2);
  assert.strictEqual(res.fallbackUsed, false);
  assert.ok(res.statuses.includes('retry_scheduled'));
});

// Cenário C: 503 -> 503 -> Fallback -> 200
await itAsync('Cenário C: 503 persistente no primário ativa modelo fallback com sucesso', async () => {
  const res = await simulateStreamOrchestration({ primaryFailsCount: 3 }); // esgota 1 inicial + 2 retries
  assert.strictEqual(res.fullText, 'Olá, mundo!');
  assert.strictEqual(res.primaryAttempts, 3);
  assert.strictEqual(res.fallbackUsed, true);
  assert.ok(res.statuses.includes('fallback_activated'));
});

// Cenário D: Todos falham -> erro amigável
await itAsync('Cenário D: Todos os modelos falham após retries', async () => {
  let threw = false;
  try {
    await simulateStreamOrchestration({ primaryFailsCount: 3, fallbackFailsCount: 2 });
  } catch (err) {
    threw = true;
    assert.strictEqual(err.message, 'Todos os modelos falharam');
  }
  assert.strictEqual(threw, true);
});

// Cenário E: Erro permanente 401 não faz retry inútil
await itAsync('Cenário E: Erro permanente 401 falha imediatamente sem retries', async () => {
  let threw = false;
  try {
    await simulateStreamOrchestration({ primaryFailsCount: 1, primaryErrorCode: 401 });
  } catch (err) {
    threw = true;
    assert.strictEqual(err.status, 401);
  }
  assert.strictEqual(threw, true);
});

// Cenário F: Streaming com falha após o primeiro token
await itAsync('Cenário F: Falha após primeiro token não duplica geração e preserva texto parcial', async () => {
  let threw = false;
  try {
    await simulateStreamOrchestration({ failAfterToken: true });
  } catch (err) {
    threw = true;
    assert.strictEqual(err.hasPartialOutput, true);
    assert.strictEqual(err.partialText, 'Olá, ');
  }
  assert.strictEqual(threw, true);
});

console.log(`\n========================================`);
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES PASSARAM COM SUCESSO!`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
