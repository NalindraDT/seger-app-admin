import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.PORT) || 3000

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port,
      host: true,
    },
    preview: {
      port,
      host: true,
    },
  }
})
