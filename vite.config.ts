import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Baris ini yang menjadi "Sihir" penyelesaian error Anda
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
