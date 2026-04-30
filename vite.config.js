import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // 显式添加 workbox 配置，确保处理静态资源
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'] 
      },
      devOptions: {
        enabled: true // 允许在开发模式下也测试 PWA
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      injectRegister: 'script-tag',
      manifest: false,
      // manifest: {
      //   name: '小猫扫描',
      //   short_name: '小猫扫描',
      //   description: '超可爱的OCR扫描工具',
      //   theme_color: '#795465',
      //   background_color: '#ffffff', // 建议加上背景色
      //   display: 'standalone',       // 必须加上这个，否则无法“安装”成独立App
      //   icons: [
      //     {
      //       src: 'meowScan-192x192.png',
      //       sizes: '192x192',
      //       type: 'image/png'
      //     },
      //     {
      //       src: 'meowScan-512x512.png',
      //       sizes: '512x512',
      //       type: 'image/png'
      //     },
      //     // 增加一个带有 purpose: 'any maskable' 的图标，这是 PWA 推荐标准
      //     {
      //       src: 'meowScan-512x512.png',
      //       sizes: '512x512',
      //       type: 'image/png',
      //       purpose: 'any maskable'
      //     }
      //   ]
      // }
    })
  ]
});