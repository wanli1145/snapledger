import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiPort = process.env.SNAPLEDGER_PORT || 3801;

export default defineConfig({
  plugins: [react()],
  // 子路径部署（GitHub Pages）时由 CI 注入，如 GH_PAGES_BASE=/snapledger/
  base: process.env.GH_PAGES_BASE || "/",
  build: {
    rollupOptions: {
      input: {
        landing: resolve(process.cwd(), "index.html"),
        app: resolve(process.cwd(), "app.html"),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": `http://localhost:${apiPort}`,
    },
  },
});
