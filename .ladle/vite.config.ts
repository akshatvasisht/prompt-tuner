import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~lib": path.resolve(__dirname, "../src/lib"),
      "~hooks": path.resolve(__dirname, "../src/hooks"),
      "~components": path.resolve(__dirname, "../src/components"),
      "~types": path.resolve(__dirname, "../src/types/index.ts"),
      "~styles": path.resolve(__dirname, "../src/styles"),
      "~": path.resolve(__dirname, "../src"),
    },
  },
  define: {
    // Plasmo exposes process.env.* to runtime; stub to empty object for harness
    "process.env": {},
  },
});
