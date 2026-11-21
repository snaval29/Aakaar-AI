import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_API_URL || 'https://marine-scale-sacrament.ngrok-free.dev').replace(/\/+$/, '')

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        },
      },
    },
  }
})
