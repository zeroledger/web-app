import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tailwindcss from "@tailwindcss/vite";
// import { visualizer } from "rollup-plugin-visualizer";

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
    // visualizer({
    //   filename: "dist/stats.html",
    //   open: false,
    // }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules") && id.includes("react-dom")) {
            return "vendor-react-dom";
          }
          if (id.includes("src/services/core/db")) {
            return "vendor-db";
          }
          if (id.includes("src/services/core/rpc")) {
            return "vendor-rpc";
          }
          if (id.includes("src/services/core/queue")) {
            return "vendor-queue";
          }
          if (id.includes("src/services/core/evmClient.service")) {
            return "vendor-evmClient";
          }
          if (id.includes("src/services/core/faucet.dto")) {
            return "vendor-faucet";
          }
          if (id.includes("src/services/tes.service")) {
            return "vendor-tes";
          }
          if (id.includes("src/services/ledger")) {
            return "vendor-ledger";
          }
          if (id.includes("src/services/viewAccount.service")) {
            return "vendor-viewAccount";
          }
          if (id.includes("src/services/ledger.service")) {
            return "vendor-ledger";
          }
          if (id.includes("src/services/history.service")) {
            return "vendor-history";
          }
          if (id.includes("src/services/sync.service")) {
            return "vendor-sync";
          }
          if (id.includes("src/services/commitments.service")) {
            return "vendor-commitments";
          }
          if (id.includes("src/services/commitmentsHistory.service")) {
            return "vendor-commitmentsHistory";
          }
        },
      },
    },
  },
});
