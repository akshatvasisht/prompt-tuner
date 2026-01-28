import { type PlasmoConfig } from "plasmo";

/**
 * Plasmo Framework Configuration
 *
 * Configures advanced features:
 * - Main World script injection for React/Vue compatibility
 * - Content script configurations
 * - Build optimizations
 */

const config: PlasmoConfig = {
  // Ensure Main World injector is compiled and injected
  // Plasmo will automatically detect and inject scripts with world: "MAIN" in their config
  build: {
    // Enable source maps for debugging
    sourcemap: true,
  },
};

export default config;
