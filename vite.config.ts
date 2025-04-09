import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',
  },
  server: {
    proxy: {
      '/nhost': {
        target: `https://backend-uxhfxqlvfwrwgyqjxpki.auth.ap-south-1.nhost.run`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nhost/, '')
      }
    }
  }
})
