import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts", "src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@src": resolve(__dirname, "./src"),
      "@test": resolve(__dirname, "./test"),
    },
  },
});
