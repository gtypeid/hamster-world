import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/hamster-controller/', // GitHub Pages 배포 시 레포 이름으로 변경 필요
  server: {
    port: 3000,
  },
})
