import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    reporters: ['verbose'],
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/index.ts",
        "src/routes/**", // Routes are better tested with integration tests
      ],
      thresholds: {
        lines: 65,
        functions: 75,
        branches: 58,
        statements: 65,
      },
    },
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
