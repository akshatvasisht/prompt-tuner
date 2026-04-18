import { test, expect } from "@playwright/test";

/**
 * Visual regression over every Ladle story.
 *
 * Each story URL uses Ladle's ?mode=preview query so chrome and sidebar
 * are hidden, leaving just the rendered component. We wait on network
 * idle plus a short settle delay so streaming mocks and font loading
 * finish before the snapshot fires.
 */

interface StoryCase {
  slug: string;
  name: string;
  /** Extra ms to wait after load — streaming stories need the script to complete. */
  settleMs?: number;
}

const STORIES: StoryCase[] = [
  { slug: "prompt-tuner-overlay--selection", name: "overlay-selection" },
  { slug: "prompt-tuner-overlay--streaming", name: "overlay-streaming", settleMs: 3000 },
  { slug: "prompt-tuner-overlay--complete", name: "overlay-complete", settleMs: 500 },
  { slug: "prompt-tuner-overlay--error", name: "overlay-error", settleMs: 500 },
  { slug: "prompt-tuner-overlay--long-input-warning", name: "overlay-long-input", settleMs: 500 },
  { slug: "mini-pill-trigger--default", name: "pill-default" },
  { slug: "mini-pill-trigger--hover", name: "pill-hover" },
  { slug: "mini-pill-trigger--active", name: "pill-active" },
  { slug: "toaster--success", name: "toast-success", settleMs: 300 },
  { slug: "toaster--error", name: "toast-error", settleMs: 300 },
  { slug: "toaster--warning", name: "toast-warning", settleMs: 300 },
];

for (const story of STORIES) {
  test(`visual: ${story.name}`, async ({ page }) => {
    await page.goto(`/?story=${story.slug}&mode=preview`);
    await page.waitForLoadState("networkidle");
    if (story.settleMs) {
      await page.waitForTimeout(story.settleMs);
    }
    await expect(page).toHaveScreenshot(`${story.name}.png`, {
      fullPage: true,
    });
  });
}
