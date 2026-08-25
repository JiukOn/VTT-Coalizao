import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['infra/tests/**/*.test.js'],
  },
  resolve: {
    alias: {
      '@data': path.resolve(__dirname, 'database/infodata'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@master': path.resolve(__dirname, 'master/src'),
      '@player': path.resolve(__dirname, 'player/src'),
      '@services': path.resolve(__dirname, 'database/services'),
      '@database': path.resolve(__dirname, 'database'),
    },
  },
})
