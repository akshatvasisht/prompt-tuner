import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright Configuration for Chrome Extension E2E Testing
 *
 * This configuration is optimized for testing Chrome extensions with:
 * - Extension loading from build directory
 * - Chrome extension context setup
 * - Mock LanguageModel API injection
 * - Increased timeouts for AI operations
 */

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Extensions can't be tested in parallel
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Only one worker to avoid extension conflicts
  reporter: "html",

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    
    // Increased timeout for AI operations
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  // Global timeout for each test
  timeout: 60000,

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Chrome extension specific settings
        // channel: "chrome", // Commented out to use installed Chromium
        // Extension will be loaded in test setup
        launchOptions: {
          args: [
            // Load extension from build directory
            `--disable-extensions-except=${path.resolve(__dirname, "build/chrome-mv3-prod")}`,
            `--load-extension=${path.resolve(__dirname, "build/chrome-mv3-prod")}`,
            // Enable experimental features for testing
            "--enable-features=Translate",
            // Disable some security features that interfere with testing
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            // Enable chrome://extensions page
            "--enable-automation",
          ],
        },
      },
    },
  ],

  // Output directory for test artifacts
  outputDir: "test-results/",
});
