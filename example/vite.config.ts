import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    root: __dirname,
    server: {
      port: 5174,
      open: true,
    },
    resolve: {
      alias: {
        // In development, use the parent library source directly for hot reload
        // In production build, use the workspace package from node_modules
        'nmea-web-serial': isDev
          ? resolve(__dirname, '../src/index.ts')
          : 'nmea-web-serial',
      },
    },
  }
})
