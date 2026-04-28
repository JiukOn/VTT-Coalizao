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
      // @shared → host/shared (contexts, hooks, utils, components used by both master and player)
      '@shared': path.resolve(__dirname, 'host/shared'),
      // @master → user/master/src (master-only UI)
      '@master': path.resolve(__dirname, 'user/master/src'),
      // @player → user/player/src (player-only UI)
      '@player': path.resolve(__dirname, 'user/player/src'),
      // @services → host/services (database, dataSeeder, campaignIO)
      '@services': path.resolve(__dirname, 'host/services'),
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
      input: {
        // Master entry (default — full GM app with IndexedDB)
        index: path.resolve(__dirname, 'index.html'),
        // Player entry (standalone — login + dashboard, no DB)
        player: path.resolve(__dirname, 'player.html'),
      },
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
