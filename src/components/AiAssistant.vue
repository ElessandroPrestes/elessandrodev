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
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline font-medium underline-offset-2 break-all"${titleAttr}>${text}</a>`
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
const showSuggestions = ref(true)
const chatContainer = ref(null)

const suggestedTopics = [
  { label: '💻 Tecnologias & Stack', query: 'Quais são as principais tecnologias e ferramentas que você domina?' },
  { label: '🏛️ Projetos CAPES & ONS', query: 'Conte sobre sua atuação nos projetos de grande porte da CAPES e ONS.' },
  { label: '🤖 IA Aplicada & SDD', query: 'Como você aplica Inteligência Artificial e Spec-Driven Development (SDD) no desenvolvimento?' },
  { label: '📈 Senioridade & Tech Lead', query: 'Qual sua senioridade, tempo de mercado e experiência como Tech Lead?' },
  { label: '⚙️ Backend & Microsserviços', query: 'Fale sobre sua experiência com PHP/Laravel, Node.js e migração para microsserviços.' },
  { label: '📬 Contato & LinkedIn', query: 'Como posso entrar em contato ou me conectar diretamente com o Elessandro?' },
]

const INITIAL_GREETING = 'Olá! Sou o assistente virtual do Elessandro Prestes. Escolha um dos tópicos abaixo ou digite sua pergunta para conhecer a carreira, projetos e especialidades dele:'

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
  showSuggestions.value = true
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

const MENU_KEYWORDS = ['menu', 'inicio', 'início', 'topico', 'topicos', 'tópicos', 'voltar', 'ajuda', 'help', 'reset', 'limpar', 'opcoes', 'opções']

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

  // Verificação de comandos de menu locais (UX rápida sem latência)
  const normalized = content.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (MENU_KEYWORDS.includes(normalized)) {
    showSuggestions.value = true
    messages.value.push({
      role: 'assistant',
      text: 'Aqui estão os tópicos principais disponíveis para consulta. Clique em qualquer um deles ou digite uma pergunta específica:',
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
      text: 'Desculpe, ocorreu um erro ao consultar a IA. Verifique se a variável VITE_GEMINI_API_KEY está configurada corretamente.',
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
    <!-- Floating Trigger Button -->
    <button
      v-if="!isOpen"
      @click="toggleChat"
      type="button"
      class="group flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium shadow-2xl shadow-indigo-900/50 hover:shadow-indigo-600/30 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-950 cursor-pointer"
      aria-label="Abrir assistente de inteligência artificial"
    >
      <span class="relative flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
      </span>
      <span class="text-sm font-semibold tracking-wide">Pergunte à IA</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
    </button>

    <!-- Chat Modal Window -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="isOpen"
        class="w-[calc(100vw-2rem)] sm:w-[440px] h-[580px] max-h-[calc(100vh-5.5rem)] sm:max-h-[640px] bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
      >
        <!-- Header -->
        <header class="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-gray-900 border-b border-gray-800 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-sm">
              ✨
            </div>
            <div>
              <h2 id="chat-title" class="text-sm font-semibold text-white">Assistente Virtual (Gemini)</h2>
              <p class="text-xs text-gray-400 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Online &bull; Powered by LangChain
              </p>
            </div>
          </div>

          <!-- Actions: Reset & Close -->
          <div class="flex items-center gap-1">
            <button
              @click="resetChat"
              title="Reiniciar conversa e voltar ao menu principal"
              class="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Reiniciar conversa e voltar ao início"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
            <button
              @click="toggleChat"
              class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Fechar assistente de IA"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Messages Area -->
        <div
          ref="chatContainer"
          class="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto overflow-x-hidden space-y-3.5 bg-gray-950/70 scroll-smooth custom-scrollbar"
        >
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="[
              'flex flex-col max-w-[88%] text-sm rounded-2xl p-3 sm:p-3.5 leading-relaxed break-words shadow-sm',
              msg.role === 'user'
                ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm'
                : msg.isError
                ? 'mr-auto bg-red-950/70 border border-red-800/80 text-red-200 rounded-tl-sm'
                : 'mr-auto bg-gray-800/95 border border-gray-700/60 text-gray-200 rounded-tl-sm'
            ]"
          >
            <!-- Render Assistant Messages with parsed Markdown -->
            <div
              v-if="msg.role === 'assistant'"
              class="markdown-content text-sm leading-relaxed"
              v-html="renderMarkdown(msg.text)"
            />
            <!-- Render User Messages as plain text -->
            <p v-else class="whitespace-pre-wrap break-words text-sm">{{ msg.text }}</p>

            <span
              :class="[
                'text-[10px] mt-2 select-none self-end shrink-0',
                msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
              ]"
            >
              {{ msg.time }}
            </span>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex items-center gap-2 mr-auto bg-gray-800/90 border border-gray-700/60 rounded-2xl rounded-tl-sm px-4 py-3 text-gray-400 text-xs">
            <span class="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0ms"></span>
            <span class="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 150ms"></span>
            <span class="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 300ms"></span>
            <span class="ml-1 text-gray-300">Consultando Gemini...</span>
          </div>
        </div>

        <!-- Suggestion Chips Bar (Persistente & Navegável) -->
        <div class="px-3 py-2 border-t border-gray-800/80 bg-gray-900/90 shrink-0 flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-[11px] text-gray-400 px-0.5">
            <span class="flex items-center gap-1 font-medium text-gray-300">
              💡 Tópicos para explorar:
            </span>
            <button
              @click="resetChat"
              class="text-indigo-400 hover:text-indigo-300 text-[10px] underline underline-offset-2 flex items-center gap-1 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>

          <!-- Horizontal scrollable topics chips -->
          <div class="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-0.5">
            <button
              v-for="(topic, i) in suggestedTopics"
              :key="i"
              @click="sendMessage(topic.query)"
              :disabled="isLoading"
              class="whitespace-nowrap shrink-0 text-[11px] px-2.5 py-1 bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-300 rounded-full border border-gray-700/80 transition-all focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
            >
              {{ topic.label }}
            </button>
          </div>
        </div>

        <!-- Footer / Input -->
        <footer class="p-3 bg-gray-900 border-t border-gray-800 shrink-0">
          <form @submit.prevent="sendMessage()" class="flex items-center gap-2">
            <input
              v-model="inputMessage"
              type="text"
              placeholder="Pergunte algo ou digite 'menu'..."
              :disabled="isLoading"
              class="flex-1 bg-gray-800 text-white placeholder-gray-500 text-sm px-3.5 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              :disabled="!inputMessage.trim() || isLoading"
              class="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Enviar mensagem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </transition>
  </div>
</template>


