import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    outDir: "docs",
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Long-lived libraries get their own files so app changes do not invalidate them in visitors' caches.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (id.includes("node_modules/zod")) return "zod";
          if (id.includes("node_modules/lucide-react")) return "icons";
          return undefined;
        },
      },
    },
  },
});
