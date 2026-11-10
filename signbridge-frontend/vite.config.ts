import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Proxy API calls to FastAPI during development
  // Run backend: uvicorn main:app --reload --port 8000
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },

  // Optimise MediaPipe for browser bundling
  optimizeDeps: {
    exclude: ["@mediapipe/tasks-vision"],
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks(id) {
          if (id.includes("@mediapipe")) return "mediapipe";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
});
