import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  base: "/",
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: [
      'admin-iqnexus.jayantasonowal.com',
      'localhost',
      '.jayantasonowal.com',
    ],
    watch: {
      usePolling: true,
    },
  },
})