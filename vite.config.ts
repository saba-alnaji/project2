import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5001,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/Cms": {
        target: "http://librarytest.runasp.net",
        changeOrigin: true,
        secure: false,
      },
      "/media": {
        target: "http://librarytest.runasp.net",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/media/, ''),
      },
      "/api": {
        target: "http://mylibrary.tryasp.net",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));