import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tailwindcss from "@tailwindcss/vite";
// import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

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
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
    // visualizer({
    //   filename: "dist/stats.html",
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split vendor libraries
          if (id.includes("node_modules")) {
            if (id.includes("@privy-io")) {
              return "vendor-auth";
            }
            if (id.includes("react-dom")) {
              return "vendor-react-dom";
            }
            if (id.includes("react") && !id.includes("@privy-io")) {
              return "vendor-react";
            }
            if (id.includes("viem")) {
              return "vendor-viem";
            }
            if (
              id.includes("@headlessui") ||
              id.includes("@heroicons") ||
              id.includes("framer-motion")
            ) {
              return "vendor-ui";
            }
            if (id.includes("snarkjs")) {
              return "vendor-snarkjs";
            }
            if (id.includes("circomlibjs")) {
              return "vendor-circomlibjs";
            }
            if (id.includes("libphonenumber-js")) {
              return "vendor-libphonenumber";
            }
            if (id.includes("@ethersproject")) {
              return "vendor-ethersproject";
            }
            if (id.includes("@base-org")) {
              return "vendor-base-org";
            }
            if (id.includes("@reown")) {
              return "vendor-reown";
            }
            if (id.includes("@walletconnect")) {
              return "vendor-walletconnect";
            }
            if (
              id.includes("axios") ||
              id.includes("debounce") ||
              id.includes("clsx") ||
              id.includes("swr")
            ) {
              return "vendor-utils";
            }
            if (id.includes("react-hook-form")) {
              return "vendor-forms";
            }
            if (id.includes("react-router")) {
              return "vendor-router";
            }
            if (id.includes("react-toastify")) {
              return "vendor-toast";
            }
            if (
              id.includes("typewriter-effect") ||
              id.includes("react-swipeable")
            ) {
              return "vendor-animations";
            }
            // Default vendor chunk for other node_modules
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "viem",
      "@headlessui/react",
      "@heroicons/react",
      "framer-motion",
      "axios",
      "debounce",
      "clsx",
      "swr",
      "react-hook-form",
      "react-router-dom",
      "react-toastify",
      "typewriter-effect",
      "react-swipeable",
    ],
  },
});
