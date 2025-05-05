
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Temporarily comment out the componentTagger until compatibility issues are resolved
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    host: true, // Listen on all local IPs
    open: true // Automatically open the browser
  },
  build: {
    sourcemap: true,
    outDir: 'dist'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
}))
