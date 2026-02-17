/* eslint-disable no-console */
/**
 * E2E Test Setup Utilities
 *
 * Provides helper functions for Chrome extension E2E testing:
 * - Extension loading and ID extraction
 * - Widget injection detection
 * - LanguageModel API mocking
 * - Platform navigation helpers
 */

import type { Page, BrowserContext } from "@playwright/test";
import { WIDGET_IDS } from "~lib/constants";

// Custom type for global with mocks
// =============================================================================

/**
 * Get the extension ID from the loaded extension
 * Chrome extensions have dynamic IDs that must be extracted at runtime
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  await Promise.resolve();
  // Extension ID is available in the service worker
  const serviceWorkers = context.serviceWorkers();
  if (serviceWorkers.length > 0 && serviceWorkers[0]) {
    const url = serviceWorkers[0].url();
    const regex = /chrome-extension:\/\/([a-z]+)\//;
    const match = regex.exec(url);
    if (match?.[1]) {
      return Promise.resolve(match[1]);
    }
  }

  // Fallback: check pages (backgroundPages is deprecated in MV3/Playwright)
  const pages = context.pages();
  for (const page of pages) {
    const url = page.url();
    const regex = /chrome-extension:\/\/([a-z]+)\//;
    const match = regex.exec(url);
    if (match?.[1]) {
      return match[1];
    }
  }

  throw new Error("Could not extract extension ID");
}

/**
 * Wait for the extension to be fully loaded and active
 */
export async function waitForExtensionLoad(
  context: BrowserContext,
  timeout = 45000, // Increased timeout for slower environments
): Promise<void> {
  const startTime = Date.now();
  console.log("[E2E] Waiting for extension to load...");

  // Monitor for new service workers
  const swPromise = new Promise<void>((resolve) => {
    context.on("serviceworker", (sw) => {
      console.log(`[E2E] Service worker registered: ${sw.url()}`);
      if (sw.url().includes("background")) {
        resolve();
      }
    });
  });

  // Check current service workers
  const checkCurrent = () => {
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length > 0 && serviceWorkers[0]) {
      console.log(`[E2E] Service worker already present: ${serviceWorkers[0].url()}`);
      return true;
    }
    return false;
  };

  if (checkCurrent()) return;

  // Race between already present, new registration, or timeout
  try {
    await Promise.race([
      swPromise,
      (async () => {
        while (Date.now() - startTime < timeout) {
          if (checkCurrent()) return;
          await new Promise((r) => setTimeout(r, 1000));
        }
        throw new Error("Timeout");
      })(),
    ]);
  } catch {
    const workers = context.serviceWorkers().map((w) => w.url());
    const pages = context.pages().map((p) => p.url());
    console.log(`[E2E] Failed to detect service worker.`);
    console.log(`[E2E] Background workers found: ${JSON.stringify(workers)}`);
    console.log(`[E2E] Pages found: ${JSON.stringify(pages)}`);
    throw new Error(`Extension did not load within ${String(timeout)}ms timeout. Check build path and manifest.`);
  }
}

// =============================================================================
// LanguageModel API Mocking
// =============================================================================

/**
 * Mock the Chrome LanguageModel API (window.ai)
 * This simulates Gemini Nano API for testing without requiring Chrome 138+
 */
export async function mockGeminiNanoAPI(
  page: Page,
  options: {
    available?: boolean;
    mockResponse?: string;
    streamingTokens?: string[];
    simulateError?: boolean;
  } = {},
): Promise<void> {
  const {
    available = true,
    mockResponse = "This is an optimized test prompt with clear structure and purpose.",
    streamingTokens = ["This ", "is ", "an ", "optimized ", "test ", "prompt."],
    simulateError = false,
  } = options;

  await page.addInitScript(
    ({ available, mockResponse, streamingTokens, simulateError }) => {
      // Mock LanguageModel API
      (window as unknown as { ai: unknown }).ai = {
        languageModel: {
          availability: async () => Promise.resolve(available ? "available" : "unavailable"),

          create: async () => {
            await Promise.resolve();
            if (simulateError) {
              throw new Error("Mock AI session creation failed");
            }

            return {
              prompt: async () => {
                if (simulateError) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
                  throw new Error("Mock AI prompt failed");
                }
                return Promise.resolve(mockResponse);
              },

              promptStreaming: async function* () {
                if (simulateError) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
                  throw new Error("Mock AI streaming failed");
                }

                for (const token of streamingTokens) {
                  yield token;
                  // Small delay to simulate streaming
                  await new Promise((resolve) => setTimeout(resolve, 50));
                }
              },

              destroy: async () => {
                // Cleanup
              },
            };
          },
        },
      };
    },
    {
      available,
      mockResponse,
      streamingTokens,
      simulateError,
    } as {
      available: boolean;
      mockResponse: string;
      streamingTokens: string[];
      simulateError: boolean;
    },
  );
}

// =============================================================================
// Platform Navigation
// =============================================================================

/**
 * Navigate to a supported LLM platform
 * Note: These may require login in real scenarios, use mock pages for testing
 */
export async function navigateToLLMPlatform(
  page: Page,
  platform: "chatgpt" | "claude" | "gemini",
): Promise<void> {
  const urls = {
    chatgpt: "https://chat.openai.com",
    claude: "https://claude.ai",
    gemini: "https://gemini.google.com",
  };

  await page.goto(urls[platform], {
    waitUntil: "domcontentloaded",
  });
}

/**
 * Create a mock chat page for testing without actual platform access
 * This creates a simple page with textarea that matches platform selectors
 */
export async function createMockChatPage(
  page: Page,
  platform: "chatgpt" | "claude" | "gemini",
): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mock ${platform} Chat</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; }
          textarea, [contenteditable] { 
            width: 100%; 
            min-height: 100px; 
            padding: 10px; 
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          [contenteditable] {
            border: 1px solid #ccc;
            padding: 10px;
            min-height: 100px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Mock ${platform.toUpperCase()} Chat Interface</h1>
          ${platform === "chatgpt"
      ? '<div contenteditable="true" data-id="root" role="textbox"></div>'
      : platform === "claude"
        ? '<div contenteditable="true" class="ProseMirror"></div>'
        : '<textarea id="chat-input" placeholder="Type your message"></textarea>'
    }
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlContent);
  await page.waitForLoadState("domcontentloaded");
}

// =============================================================================
// Console and Error Monitoring
// =============================================================================

/**
 * Monitor page console for errors
 * Returns array of console messages collected during test
 */
export function monitorConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const errorText = msg.text();
      errors.push(errorText);
      console.log(`Console Error observed: ${errorText}`);
    }
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

/**
 * Assert no console errors occurred during test
 */
export function assertNoConsoleErrors(errors: string[]): void {
  const relevantErrors = errors.filter(
    (error) =>
      // Filter out known harmless errors
      !error.includes("favicon") &&
      !error.includes("Extension context invalidated") &&
      !error.includes("ResizeObserver"),
  );

  if (relevantErrors.length > 0) {
    throw new Error(
      `Console errors detected:\n${relevantErrors.join("\n")}`,
    );
  }
}

// =============================================================================
// Textarea Interaction Helpers
// =============================================================================

/**
 * Find and focus the chat textarea on the page
 */
export async function focusChatTextarea(
  page: Page,
  platform: "chatgpt" | "claude" | "gemini",
): Promise<void> {
  const selectors = {
    chatgpt: '[contenteditable="true"][data-id="root"]',
    claude: '[contenteditable="true"].ProseMirror',
    gemini: 'textarea#chat-input, textarea[placeholder]',
  };

  const selector = selectors[platform];
  await page.waitForSelector(selector, { timeout: 10000 });
  await page.click(selector);
  await page.waitForTimeout(500); // Wait for focus events to propagate
}

/**
 * Type text into the chat textarea
 */
export async function typeInChatTextarea(
  page: Page,
  platform: "chatgpt" | "claude" | "gemini",
  text: string,
): Promise<void> {
  const selectors = {
    chatgpt: '[contenteditable="true"][data-id="root"]',
    claude: '[contenteditable="true"].ProseMirror',
    gemini: 'textarea#chat-input, textarea[placeholder]',
  };

  const selector = selectors[platform];
  await page.fill(selector, text);
}

/**
 * Get text content from the chat textarea
 */
export async function getChatTextareaContent(
  page: Page,
  platform: "chatgpt" | "claude" | "gemini",
): Promise<string> {
  const selectors = {
    chatgpt: '[contenteditable="true"][data-id="root"]',
    claude: '[contenteditable="true"].ProseMirror',
    gemini: 'textarea#chat-input, textarea[placeholder]',
  };

  const selector = selectors[platform];
  const element = await page.$(selector);

  if (!element) {
    return "";
  }

  if (platform === "gemini") {
    return await element.inputValue();
  } else {
    return (await element.textContent()) ?? "";
  }
}

/**
 * Waits for the trigger button to be injected into the DOM
 */
export async function waitForTriggerInjection(
  page: Page,
  timeout = 10000,
): Promise<void> {
  await page.waitForSelector(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`, {
    timeout,
    state: "visible",
  });
}

/**
 * Simulates text selection in a contenteditable or textarea
 */
export async function selectTextInArea(page: Page, selector: string): Promise<void> {
  await page.waitForSelector(selector);
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;

    // Create a selection
    const range = document.createRange();
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.focus();
      el.setSelectionRange(0, el.value.length);
    } else {
      range.selectNodeContents(el);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    // Dispatch mouseup to trigger the extension's selection listener
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  }, selector);
}
