import process from 'node:process'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    // For GitHub Pages, use the repository name as base path
    // Set VITE_BASE_PATH env var to override (e.g., '/' for root)
    // Only use base path in production builds
    base: isProduction ? (process.env.VITE_BASE_PATH || '/nmea-web-serial/') : '/',
    server: {
      port: 5176,
    },
  }
})
