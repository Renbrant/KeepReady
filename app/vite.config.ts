import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'KeepReady',
        short_name: 'KeepReady',
        description: 'Family emergency food, water and supply planner: buckets, calories, rotation and shopping. Works offline.',
        lang: 'en',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#0B0E14',
        theme_color: '#0B0E14',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // O leitor de código de barras (zxing) pesa ~440 KB: não entra na instalação. Baixa na primeira vez que você abre o leitor e fica guardado.
        globIgnores: ['**/zxing-*.js'],
        runtimeCaching: [{ urlPattern: /\/assets\/zxing-[^/]+\.js$/, handler: 'CacheFirst', options: { cacheName: 'kr-zxing', expiration: { maxEntries: 4 } } }],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: { rollupOptions: { output: { manualChunks: (id) => (id.includes('@zxing') ? 'zxing' : undefined) } } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
