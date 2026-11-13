import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  build: {
    // three.js を含むため 500kB 警告の閾値を緩める（PoC用途）
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // three 系を別チャンクに分け、アプリ側の更新時のキャッシュ効率を上げる
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})
