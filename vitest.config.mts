import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules", ".next", ".vercel"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**", "api/**", "services/**", "app/api/**"],
      exclude: ["lib/graphql/**", "lib/types/**", "lib/mappers/**"],
    },
    testTimeout: 20000,
  },
});
