import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Enables PWA testing in local dev mode
      },
      manifest: {
        name: 'Data Scientist Roadmap Tracker',
        short_name: 'DS Tracker',
        description: 'Track your Data Science journey and daily habits',
        theme_color: '#1e293b', // Matches your sidebar color
        background_color: '#f8fafc',
        display: 'standalone', // Hides the browser address bar
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png', // You can add these icons to your /public folder later
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true, // This enables network access (mobile sync) automatically
    port: 5173,  // Keeps the port consistent
  }
})