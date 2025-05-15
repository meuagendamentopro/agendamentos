import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  // Configuração para garantir que o roteamento do lado do cliente funcione
  server: {
    port: 3000,
    host: true
  },
});
