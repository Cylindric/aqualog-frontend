/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep chart libs matched before the generic @mantine rule,
          // otherwise they get folded into vendor-mantine.
          if (id.includes('node_modules/@mantine/charts') || id.includes('node_modules/recharts')) {
            return 'vendor-charts'
          }

          if (id.includes('node_modules/@mantine/')) {
            return 'vendor-mantine'
          }

          if (id.includes('node_modules/react-oidc-context') || id.includes('node_modules/oidc-client-ts')) {
            return 'vendor-auth'
          }

          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router/')
          ) {
            return 'vendor-react'
          }

          return undefined
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
