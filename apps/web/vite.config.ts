import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/sos-procuresphere-360-platform/" : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.jpg", "media/*"],
      manifest: {
        name: "SOS ProcureSphere 360",
        short_name: "ProcureSphere360",
        description: "Unified procurement, document management, and finance workflow platform.",
        theme_color: "#0284c7",
        background_color: "#081626",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/logo.jpg",
            sizes: "512x512",
            type: "image/jpeg"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@sos-procuresphere/shared": resolve(__dirname, "../../packages/shared/src/index.ts")
    }
  },
  server: {
    port: 5173
  }
});
