import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import crypto from "crypto";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Hash the password at build time to prevent plain text injection
  const passwordHash = env.VITE_APP_PASSWORD
    ? crypto.createHash("sha256").update(env.VITE_APP_PASSWORD).digest("hex")
    : "";

  return {
    define: {
      __APP_USERNAME__: JSON.stringify(env.VITE_APP_USERNAME || ""),
      __APP_PASSWORD_HASH__: JSON.stringify(passwordHash),
    },
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
  };
});
