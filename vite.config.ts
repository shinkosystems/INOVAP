import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'INOVAP - Ecossistema de Inovação',
        short_name: 'INOVAP',
        description: 'Sistema de gestão de times e landing page para o Ecossistema de Inovação do Alto Paraopeba.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://jmhquynjyekclwxjgupk.supabase.co/storage/v1/object/public/logotipos/logotipos/2.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://jmhquynjyekclwxjgupk.supabase.co/storage/v1/object/public/logotipos/logotipos/2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
});