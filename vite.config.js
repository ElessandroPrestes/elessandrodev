import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:3201',
    changeOrigin: true,
  },
}

export default defineConfig({
  base: '/elessandrodev/',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5212,
    strictPort: true,
    proxy: apiProxy,
  },
  preview: {
    host: '0.0.0.0',
    port: 5212,
    strictPort: true,
    proxy: apiProxy,
  },
})
