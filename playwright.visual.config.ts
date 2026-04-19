import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression config - separate from the extension e2e config.
 *
 * Boots Ladle's dev server on :61000, then iterates through story URLs
 * and diffs each against a committed PNG baseline under
 * tests/visual/__screenshots__/.
 *
 * Run:
 *   npm run test:visual           # assert against baselines
 *   npm run test:visual:update    # regenerate baselines after intentional changes
 */
export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "./tests/visual/out",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  use: {
    baseURL: "http://127.0.0.1:61000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-light",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 900, height: 700 },
        colorScheme: "light",
      },
    },
    {
      name: "chromium-dark",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 900, height: 700 },
        colorScheme: "dark",
      },
    },
  ],
  webServer: {
    command: "npm run storybook",
    url: "http://127.0.0.1:61000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
