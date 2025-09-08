import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    nodePolyfills({
      include: ["events"],
      globals: {
        Buffer: true,
        global: true,
      },
    }),
    tailwindcss(),
    mkcert(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("viewAccount.service")) {
            return "viewAccountService";
          }
        },
      },
    },
  },
});
