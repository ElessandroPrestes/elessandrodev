<script setup>
import { ref, nextTick } from 'vue'
import { askAssistant } from '../services/aiService'

const isOpen = ref(false)
const inputMessage = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)

const suggestedQuestions = [
  'Quais suas principais tecnologias?',
  'Conte sobre sua experiência na CAPES e ONS.',
  'Como você aplica IA no desenvolvimento?',
  'Qual sua senioridade e tempo de mercado?',
]

const messages = ref([
  {
    role: 'assistant',
    text: 'Olá! Sou o assistente virtual do Elessandro Prestes. Como posso te ajudar a conhecer melhor a trajetória e habilidades dele?',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
])

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

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
  isLoading.value = true
  scrollToBottom()

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
    scrollToBottom()
  }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[999] font-sans">
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
        class="w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
      >
        <!-- Header -->
        <header class="flex items-center justify-between px-5 py-4 bg-gray-900/90 border-b border-gray-800 backdrop-blur">
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
        </header>

        <!-- Messages Area -->
        <div
          ref="chatContainer"
          class="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-950/60 scroll-smooth"
        >
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="[
              'flex flex-col max-w-[85%] text-sm rounded-2xl p-3.5 leading-relaxed',
              msg.role === 'user'
                ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm'
                : msg.isError
                ? 'mr-auto bg-red-950/60 border border-red-800/80 text-red-200 rounded-tl-sm'
                : 'mr-auto bg-gray-800/90 border border-gray-700/60 text-gray-200 rounded-tl-sm'
            ]"
          >
            <p class="whitespace-pre-wrap">{{ msg.text }}</p>
            <span
              :class="[
                'text-[10px] mt-1.5 select-none self-end',
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

        <!-- Suggestion Chips -->
        <div v-if="messages.length <= 2 && !isLoading" class="px-4 py-2 border-t border-gray-800/60 bg-gray-900/60 flex flex-wrap gap-1.5">
          <button
            v-for="(chip, i) in suggestedQuestions"
            :key="i"
            @click="sendMessage(chip)"
            class="text-[11px] text-left px-2.5 py-1 bg-gray-800 hover:bg-gray-700 hover:text-white text-gray-300 rounded-full border border-gray-700/80 transition-colors"
          >
            {{ chip }}
          </button>
        </div>

        <!-- Footer / Input -->
        <footer class="p-3 bg-gray-900 border-t border-gray-800">
          <form @submit.prevent="sendMessage()" class="flex items-center gap-2">
            <input
              v-model="inputMessage"
              type="text"
              placeholder="Digite sua pergunta..."
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
