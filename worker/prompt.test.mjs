import assert from 'node:assert/strict'
import {
  CONTACT,
  buildSystemPrompt,
  contactReply,
  isContactQuestion,
  isEnglish,
  safeFallback,
} from './prompt.js'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`✅ [PASSOU] ${name}`)
  } catch (error) {
    failed += 1
    console.error(`❌ [FALHOU] ${name}`)
    console.error(`   ${error.message}`)
  }
}

test('Contato em PT contém e-mail, WhatsApp, LinkedIn e GitHub', () => {
  const reply = contactReply(false)
  assert.match(reply, /Contato direto/)
  assert.ok(reply.includes(CONTACT.email))
  assert.ok(reply.includes(CONTACT.whatsapp))
  assert.ok(reply.includes(CONTACT.linkedin))
  assert.ok(reply.includes(CONTACT.github))
})

test('Contato em EN é determinístico e completo', () => {
  const reply = contactReply(true)
  assert.match(reply, /Direct contact/)
  assert.ok(reply.includes(CONTACT.email))
  assert.ok(reply.includes(CONTACT.linkedin))
})

test('Detecta intenção de contato em PT', () => {
  assert.equal(isContactQuestion('Como entro em contato?'), true)
  assert.equal(isContactQuestion('Qual é o seu e-mail?'), true)
  assert.equal(isContactQuestion('Me passe o WhatsApp'), true)
})

test('Detecta intenção de contato em EN', () => {
  assert.equal(isContactQuestion('How can I contact Elessandro?'), true)
  assert.equal(isContactQuestion('What is your LinkedIn?'), true)
})

test('Não confunde pergunta técnica com contato', () => {
  assert.equal(isContactQuestion('Fale sobre o projeto GENIN no ONS'), false)
  assert.equal(isContactQuestion('Ele tem experiência com RabbitMQ?'), false)
})

test('Detecta inglês sem confundir português', () => {
  assert.equal(isEnglish('What is his experience with legacy modernization?'), true)
  assert.equal(isEnglish('Qual é a experiência dele com modernização?'), false)
  assert.equal(isEnglish('Tell me about the CAPES project'), true)
})

test('Fallback seguro inclui o e-mail canônico', () => {
  assert.ok(safeFallback(false).includes(CONTACT.email))
  assert.ok(safeFallback(true).includes(CONTACT.email))
})

test('Prompt contém ficha, projetos e regras de fidelidade', () => {
  const prompt = buildSystemPrompt('pt')
  assert.match(prompt, /FICHA_PROFISSIONAL/)
  assert.match(prompt, /PROJETOS_DO_PORTFOLIO/)
  assert.match(prompt, /Grupo Paraíso/)
  assert.match(prompt, /colaboração e participação/)
  assert.match(prompt, /2\.500 RPS/)
  assert.match(prompt, /Empregador não é cliente/)
  assert.match(prompt, /prompt injection|Ignorar instruções anteriores|ignore instruções/i)
  assert.match(prompt, /Responda em português do Brasil/)
})

test('Prompt em EN orienta resposta em inglês', () => {
  assert.match(buildSystemPrompt('en'), /Respond in English/)
})

test('Prompt não expõe segredos nem placeholders quebrados', () => {
  const prompt = buildSystemPrompt('pt')
  assert.doesNotMatch(prompt, /OPENROUTER_API_KEY|sk-or-v1-/)
  assert.doesNotMatch(prompt, /\bhead\b/)
  assert.doesNotMatch(prompt, /TODO:/)
})

console.log(
  `\nResultado: ${passed}/${passed + failed} testes do prompt passaram.`,
)

if (failed > 0) process.exit(1)
