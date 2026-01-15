import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "tiny-shop.png",
        "tiny-shop-icon.svg",
        "tiny-shop-icon-iphone.png",
      ],
      manifest: {
        name: "Tiny Shop",
        short_name: "Tiny Shop",
        description: "Quản lý kho hàng và đơn hàng nhỏ gọn",
        theme_color: "#fff7ed",
        background_color: "#fff7ed",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/tiny-shop-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/tiny-shop.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/tiny-shop.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
