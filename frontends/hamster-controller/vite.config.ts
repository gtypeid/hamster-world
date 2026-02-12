import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/hamster-controller/', // GitHub Pages 배포 시 레포 이름으로 변경 필요
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, '../common'),
    },
    // common/ 디렉토리의 파일들이 hamster-controller의 node_modules를 사용하도록
    dedupe: ['react', 'react-dom', 'reactflow', 'dagre'],
  },
  server: {
    port: 3000,
  },
})
