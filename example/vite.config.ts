import { resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  // For GitHub Pages, use the repository name as base path
  // Set VITE_BASE_PATH env var to override (e.g., '/' for root)
  // Only use base path in production builds
  const base = isDev ? '/' : (process.env.VITE_BASE_PATH || '/nmea-web-serial/')

  return {
    root: __dirname,
    base,
    server: {
      port: 5174,
      open: true,
    },
    resolve: {
      alias: {
        // In development, use the parent library source directly for hot reload
        // In production build, use the built workspace package from node_modules
        'nmea-web-serial': isDev
          ? resolve(__dirname, '../src/index.ts')
          : 'nmea-web-serial',
      },
    },
  }
})
