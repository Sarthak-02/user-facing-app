import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      injectManifest: {
        swSrc: "src/sw.js", // ✅ source service worker (module)
        swDest: "sw.js", // output service worker name
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
      registerType: "autoUpdate",
      devOptions: {
        enabled: true, // Enable in dev mode for testing
        type: 'module',
      },
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
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
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
