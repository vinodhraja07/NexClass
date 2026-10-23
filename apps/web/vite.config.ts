import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(here, "src"),
      "@nexclass/shared": path.resolve(here, "../../packages/shared/src/index.ts"),
      "@nexclass/terminology": path.resolve(here, "../../packages/terminology/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:4000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:4000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
