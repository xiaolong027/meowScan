import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/meowScan/',
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: '小猫扫描',
        short_name: '小猫扫描',
        description: '超可爱的OCR扫描工具',
        theme_color: '#795465',
        icons: [
          {
            src: 'meowScan-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'meowScan-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true,
      }
    })
  ]
});