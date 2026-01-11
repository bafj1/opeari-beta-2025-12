import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()]

  // TEMPORARILY DISABLED FOR STABILITY
  // if (mode !== 'development') {
  //   plugins.push(
  //     VitePWA({
  //       registerType: 'autoUpdate',
  //       includeAssets: ['favicon.ico', 'manifest.webmanifest', 'icons/*.png', 'sitemap.xml'],
  //       manifest: false,
  //       workbox: {
  //         globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest,xml}'],
  //         runtimeCaching: [
  //           {
  //             urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
  //             handler: 'CacheFirst',
  //             options: {
  //               cacheName: 'google-fonts-stylesheets',
  //               expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
  //             }
  //           },
  //           {
  //             urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
  //             handler: 'CacheFirst',
  //             options: {
  //               cacheName: 'google-fonts-webfonts',
  //               expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
  //             }
  //           }
  //         ]
  //       }
  //     })
  //   )
  // }

  return {
    plugins,
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      watch: {
        ignored: [
          '**/playwright-report/**',
          '**/docs/**',
          '**/.netlify/**',
          '**/dist/**'
        ]
      }
    }
  }
})

