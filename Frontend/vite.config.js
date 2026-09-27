import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs'  // <-- Add this line
  },
  server: {
    port: 3000,
    host: true  // <-- Add this to access from phone
  }
})