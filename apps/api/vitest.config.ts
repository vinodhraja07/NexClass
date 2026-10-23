import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@nexclass/shared": path.resolve(here, "../../packages/shared/src/index.ts"),
      "@nexclass/terminology": path.resolve(here, "../../packages/terminology/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    hookTimeout: 20000,
    testTimeout: 20000,
  },
});
