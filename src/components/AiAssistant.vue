<script setup>
import { ref, nextTick } from 'vue'
import { marked } from 'marked'
import { askAssistant } from '../services/aiService'

// Configuração do Marked para conversão de markdown limpo
marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderer = new marked.Renderer()
renderer.link = ({ href, title, text }) => {
  const titleAttr = title ? ` title="${title}"` : ''
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium underline-offset-2 break-all"${titleAttr}>${text}</a>`
}
marked.use({ renderer })

function renderMarkdown(text) {
  if (!text) return ''
  try {
    return marked.parse(text)
  } catch (err) {
    console.error('Erro ao renderizar markdown:', err)
    return text
  }
}

const isOpen = ref(false)
const inputMessage = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)

const suggestedTopics = [
  { label: '🏛️ Projetos CAPES & ONS', query: 'Conte em detalhes sobre sua atuação técnica e arquitetural nos projetos de missão crítica da CAPES e ONS.' },
  { label: '🤖 SDD & IA Aplicada', query: 'Como você aplica Inteligência Artificial, SDD e RAG no seu ciclo de desenvolvimento?' },
  { label: '⚙️ Strangler Fig & Legados', query: 'Como você conduziu a modernização de monolitos com Strangler Fig Pattern e eliminação de código legado?' },
  { label: '📈 Tech Lead & Concorrência', query: 'Fale sobre sua experiência como Tech Lead suportando 2.500 RPS e alta concorrência.' },
  { label: '📬 Contato Direto', query: 'Como posso falar diretamente com o Elessandro?' },
]

const INITIAL_GREETING = 'Terminal interativo RAG ativo. Consulte dados técnicos factuais, métricas de produção, decisões de arquitetura e histórico profissional do Elessandro Prestes:'

const messages = ref([
  {
    role: 'assistant',
    text: INITIAL_GREETING,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
])

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    scrollToBottom(100)
  }
}

function resetChat() {
  messages.value = [
    {
      role: 'assistant',
      text: INITIAL_GREETING,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]
  inputMessage.value = ''
  scrollToBottom(50)
}

function scrollToBottom(delay = 50) {
  nextTick(() => {
    setTimeout(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    }, delay)
  })
}

const MENU_KEYWORDS = ['menu', 'inicio', 'início', 'topico', 'topicos', 'tópicos', 'voltar', 'ajuda', 'help', 'reset', 'limpar']

async function sendMessage(textToSend) {
  const content = (textToSend || inputMessage.value).trim()
  if (!content || isLoading.value) return

  const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  messages.value.push({
    role: 'user',
    text: content,
    time: userTime,
  })

  inputMessage.value = ''
  scrollToBottom()

  const normalized = content.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (MENU_KEYWORDS.includes(normalized)) {
    messages.value.push({
      role: 'assistant',
      text: 'Selecione um dos tópicos de consulta acima ou formule uma pergunta direta sobre arquitetura, métricas ou histórico técnico:',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
    scrollToBottom(50)
    return
  }

  isLoading.value = true

  try {
    const aiResponse = await askAssistant(content)
    messages.value.push({
      role: 'assistant',
      text: aiResponse,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  } catch (err) {
    console.error('Erro na chamada do Gemini:', err)
    messages.value.push({
      role: 'assistant',
      text: 'Desculpe, ocorreu uma instabilidade na consulta à IA. Verifique se a variável VITE_GEMINI_API_KEY está configurada.',
      isError: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  } finally {
    isLoading.value = false
    scrollToBottom(80)
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999] font-sans">
    <!-- Floating Terminal Trigger -->
    <button
      v-if="!isOpen"
      @click="toggleChat"
      type="button"
      class="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#12141a] dark:text-neutral-100 dark:hover:bg-[#191c24] border border-slate-700 dark:border-neutral-700 hover:border-indigo-500 shadow-xl transition-all font-mono text-xs tracking-wider cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label="Abrir terminal de consulta RAG com Inteligência Artificial"
    >
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span class="font-semibold text-[11px]">// AI TERMINAL (RAG)</span>
      <span class="text-indigo-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">&rarr;</span>
    </button>

    <!-- Chat Terminal Window -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-98"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-3 scale-98"
    >
      <div
        v-if="isOpen"
        class="w-[calc(100vw-2rem)] sm:w-[460px] h-[590px] max-h-[calc(100vh-5rem)] sm:max-h-[640px] bg-white dark:bg-[#0f1117] border border-slate-300 dark:border-neutral-750 rounded-lg shadow-2xl flex flex-col overflow-hidden transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminal-title"
      >
        <!-- Header -->
        <header class="flex items-center justify-between px-4 py-3 bg-slate-100/90 dark:bg-[#14161f] border-b border-slate-200 dark:border-neutral-800 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">&gt;_</span>
            <div>
              <h2 id="terminal-title" class="font-mono text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                ASSISTENTE RAG // GEMINI
              </h2>
              <p class="font-mono text-[10px] text-slate-500 dark:text-neutral-400">
                CONTEXTO VETORIAL DETERMINÍSTICO
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="resetChat"
              title="Reiniciar consulta"
              class="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-200 dark:text-neutral-400 dark:hover:text-indigo-400 dark:hover:bg-neutral-800 transition-colors font-mono text-xs"
              aria-label="Reiniciar conversa"
            >
              RESET
            </button>
            <button
              @click="toggleChat"
              class="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors font-mono text-xs"
              aria-label="Fechar terminal de IA"
            >
              &times;
            </button>
          </div>
        </header>

        <!-- Messages Area -->
        <div
          ref="chatContainer"
          class="flex-1 min-h-0 p-4 overflow-y-auto overflow-x-hidden space-y-3.5 bg-slate-50/50 dark:bg-[#0a0b0e]/70 scroll-smooth custom-scrollbar"
        >
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="[
              'flex flex-col max-w-[88%] text-xs sm:text-sm rounded p-3 leading-relaxed break-words',
              msg.role === 'user'
                ? 'ml-auto bg-slate-900 text-white dark:bg-indigo-950/70 dark:border dark:border-indigo-800/60 dark:text-indigo-100 shadow-xs'
                : msg.isError
                ? 'mr-auto bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/60 dark:border-red-900 dark:text-red-200'
                : 'mr-auto bg-white border border-slate-200/90 text-slate-800 dark:bg-[#12141a] dark:border-neutral-800 dark:text-neutral-200 shadow-xs'
            ]"
          >
            <div
              v-if="msg.role === 'assistant'"
              class="markdown-content text-xs sm:text-sm leading-relaxed"
              v-html="renderMarkdown(msg.text)"
            />
            <p v-else class="whitespace-pre-wrap break-words text-xs sm:text-sm font-sans">{{ msg.text }}</p>

            <span
              :class="[
                'text-[10px] font-mono mt-2 self-end shrink-0',
                msg.role === 'user' ? 'text-slate-400 dark:text-indigo-300' : 'text-slate-400 dark:text-neutral-500'
              ]"
            >
              {{ msg.time }}
            </span>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex items-center gap-2 mr-auto bg-white border border-slate-200 dark:bg-[#12141a] dark:border-neutral-800 rounded px-3 py-2 text-slate-600 dark:text-neutral-400 text-xs font-mono">
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>CONSULTANDO MODELO GEMINI...</span>
          </div>
        </div>

        <!-- Suggestion Chips Bar -->
        <div class="px-3 py-2 border-t border-slate-200 dark:border-neutral-800 bg-slate-100/70 dark:bg-[#12141a] shrink-0">
          <div class="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            <button
              v-for="(topic, i) in suggestedTopics"
              :key="i"
              @click="sendMessage(topic.query)"
              :disabled="isLoading"
              class="whitespace-nowrap shrink-0 font-mono text-[10px] px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded border border-slate-200 dark:bg-[#171922] dark:hover:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-750 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {{ topic.label }}
            </button>
          </div>
        </div>

        <!-- Footer / Input Form -->
        <footer class="p-3 bg-white dark:bg-[#14161f] border-t border-slate-200 dark:border-neutral-800 shrink-0">
          <form @submit.prevent="sendMessage()" class="flex items-center gap-2">
            <input
              v-model="inputMessage"
              type="text"
              placeholder="Digite uma pergunta técnica..."
              :disabled="isLoading"
              class="flex-1 font-mono text-xs bg-slate-50 text-slate-900 placeholder-slate-400 px-3 py-2 rounded border border-slate-200 focus:outline-none focus:border-indigo-600 dark:bg-[#0a0b0e] dark:text-white dark:placeholder-neutral-500 dark:border-neutral-750 dark:focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              :disabled="!inputMessage.trim() || isLoading"
              class="font-mono text-xs px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              ENVIAR
            </button>
          </form>
        </footer>
      </div>
    </transition>
  </div>
</template>
