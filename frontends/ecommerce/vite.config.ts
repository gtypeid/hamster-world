import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ecommerce/',
  server: {
    port: 3006,
    open: true,
  },
})
