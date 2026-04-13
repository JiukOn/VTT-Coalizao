import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Projeto-VTP/',
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
          if (id.includes('/data/creatures/')) return 'data-creatures'
          if (id.includes('/data/items/')) return 'data-items'
          if (id.includes('/data/abilities/')) return 'data-abilities'
        },
      },
    },
  },
})
