import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const shims = ["get", "uniqBy", "sortBy", "isPlainObject", "range", "last", "maxBy", "minBy", "throttle", "sumBy", "omit"];
const esToolkitAliases = {};
shims.forEach(name => {
  esToolkitAliases[`es-toolkit/compat/${name}`] = path.resolve(__dirname, `./src/shims/es-toolkit-compat/${name}.js`);
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            // Cache Supabase REST API calls (stale-while-revalidate for speed)
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 }, // 5 min
              networkTimeoutSeconds: 10,
            }
          },
          {
            // Cache dicebear avatars
            urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dicebear-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            }
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            }
          }
        ]
      },
      manifest: {
        name: 'BubblePet Spa & Tienda',
        short_name: 'BubblePet',
        description: 'Sistema de gestión integral para Spa de Mascotas — Agenda, Grooming, Inventario y Facturación.',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#000000',
        background_color: '#f8fafc',
        categories: ['business', 'lifestyle', 'productivity'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true // Permite probar PWA en modo dev
      }
    })
  ],
  resolve: {
    alias: esToolkitAliases
  },
  optimizeDeps: {
    include: ['tslib']
  }
})