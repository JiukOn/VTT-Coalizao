import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/VTT-Coalizao/',
  resolve: {
    alias: {
      // @data → database/infodata (accessible from any file in host/src)
      '@data': path.resolve(__dirname, 'database/infodata'),
      // @host → host/src
      '@host': path.resolve(__dirname, 'host/src'),
      // @user → user/src
      '@user': path.resolve(__dirname, 'user/src'),
    },
  },
  server: {
    host: true,        // bind to 0.0.0.0 — allows LAN access for players
    port: 5173,
    proxy: {
      // Proxy /api calls to the Node server in dev mode
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'vendor-react'
          if (id.includes('node_modules/dexie')) return 'vendor-dexie'
          if (id.includes('/database/infodata/creatures/')) return 'data-creatures'
          if (id.includes('/database/infodata/items/')) return 'data-items'
          if (id.includes('/database/infodata/skills/')) return 'data-skills'
        },
      },
    },
  },
})
