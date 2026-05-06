import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/app/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: [
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],
      manifest: {
        name: "Digi School",
        short_name: "DigiSchool",
        description: "Attendance, homework & notifications for teachers",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/app/",
        scope: "/app/",
        icons: [
          {
            src: "/app/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/app/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/app/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Take Attendance",
            short_name: "Attendance",
            url: "/app/staff/attendance",
            icons: [{ src: "/app/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "View Homework",
            short_name: "Homework",
            url: "/app/staff/homework",
            icons: [{ src: "/app/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/userfacing": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        secure: false,
      },
      "/rag-service": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
