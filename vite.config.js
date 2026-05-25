import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mediaPlugin from './vite-media-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mediaPlugin()
  ],
})
