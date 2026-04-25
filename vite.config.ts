import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3741,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          globe: ["react-globe.gl", "three", "topojson-client"],
          motion: ["framer-motion"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react-globe.gl", "three"],
  },
});
