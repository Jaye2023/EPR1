import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true
      }
    }
  },
  server: {
    host: '192.168.18.182',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        debug: true
      },
      '/css': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/js': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})