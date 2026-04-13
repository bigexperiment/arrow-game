import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "ArrowX",
        short_name: "ArrowX",
        description: "Chain reaction arrow puzzle",
        theme_color: "#08080e",
        background_color: "#08080e",
        display: "standalone",
        start_url: ".",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      includeAssets: ["icon.svg"],
      filename: "manifest.webmanifest",
      workbox: {
        navigateFallback: "/index.html",
      },
    }),
  ],
});
