import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/types/**"],
    },
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
      "~lib": resolve(__dirname, "./src/lib"),
      "~types": resolve(__dirname, "./src/types/index.ts"),
      "~hooks": resolve(__dirname, "./src/hooks"),
      "~components": resolve(__dirname, "./src/components"),
    },
  },
});
