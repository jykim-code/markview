import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@ext": resolve(__dirname, "src"),
    },
  },
  base: "./",
  build: {
    cssCodeSplit: false,
    modulePreload: false,
    crossOriginLoading: false,
    outDir: "dist",
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel.html"),
        "mermaid-sandbox": resolve(__dirname, "src/mermaid-sandbox.html"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks: undefined,
      },
    },
    target: "esnext",
    minify: "terser",
    chunkSizeWarningLimit: 1500,
  },
});
