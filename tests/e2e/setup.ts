/**
 * E2E Test Setup Utilities
 *
 * Provides helper functions for Chrome extension E2E testing:
 * - Extension loading and ID extraction
 * - Widget injection detection
 * - LanguageModel API mocking
 * - Platform navigation helpers
 */

import { Page, BrowserContext } from "@playwright/test";
import path from "path";

// =============================================================================
// Extension Management
// =============================================================================

/**
 * Get the extension ID from the loaded extension
 * Chrome extensions have dynamic IDs that must be extracted at runtime
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  // Extension ID is available in the service worker
  const serviceWorkers = context.serviceWorkers();
  if (serviceWorkers.length > 0) {
    const url = serviceWorkers[0].url();
    const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
    if (match) {
      return match[1];
    }
  }

  // Fallback: check background pages
  const backgroundPages = context.backgroundPages();
  if (backgroundPages.length > 0) {
    const url = backgroundPages[0].url();
    const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
    if (match) {
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
  timeout = 10000,
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length > 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  throw new Error("Extension did not load within timeout");
}

// =============================================================================
// Trigger Button Detection (New Architecture)
// =============================================================================

/**
 * Wait for the Prompt Tuner trigger button to be injected
 */
export async function waitForTriggerInjection(
  page: Page,
  timeout = 15000
): Promise<void> {
  await page.waitForSelector('[data-testid="trigger-button"]', {
    timeout,
    state: "attached",
  });
}

/**
 * Check if trigger button is visible
 */
export async function isTriggerVisible(page: Page): Promise<boolean> {
  const trigger = await page.$('[data-testid="trigger-button"]');
  if (!trigger) return false;
  return await trigger.isVisible();
}

// =============================================================================
// Side Panel Utilities (New Architecture)
// =============================================================================

/**
 * Wait for side panel to open
 */
export async function waitForSidePanelOpen(
  page: Page,
  timeout = 10000
): Promise<void> {
  // Side panel runs in extension context, need to find the panel page
  const context = page.context();
  
  // Wait for new page (side panel)
  const panelPromise = context.waitForEvent('page', { timeout });
  const panel = await panelPromise;
  
  // Wait for panel to load
  await panel.waitForLoadState('domcontentloaded');
}

/**
 * Get side panel page handle
 */
export async function getSidePanelPage(page: Page): Promise<Page | null> {
  const context = page.context();
  const pages = context.pages();
  
  // Find page with sidepanel.html in URL
  for (const p of pages) {
    if (p.url().includes('sidepanel.html')) {
      return p;
    }
  }
  
  return null;
}

/**
 * Click trigger button to open panel
 */
export async function openSidePanel(page: Page): Promise<Page> {
  const trigger = await page.$('[data-testid="trigger-button"]');
  if (!trigger) {
    throw new Error('Trigger button not found');
  }
  
  // Click trigger and wait for panel
  const panelPromise = page.context().waitForEvent('page');
  await trigger.click();
  const panel = await panelPromise;
  
  await panel.waitForLoadState('domcontentloaded');
  return panel;
}

// =============================================================================
// Test ID Constants
// =============================================================================

export const TRIGGER_BUTTON = '[data-testid="trigger-button"]';
export const PANEL_OPTIMIZE_BUTTON = '[data-testid="panel-optimize-button"]';
export const PANEL_ACCEPT_BUTTON = '[data-testid="panel-accept-button"]';
export const PANEL_CANCEL_BUTTON = '[data-testid="panel-cancel-button"]';
export const PANEL_ORIGINAL_TEXT = '[data-testid="panel-original-text"]';
export const PANEL_OPTIMIZED_TEXT = '[data-testid="panel-optimized-text"]';
export const PANEL_STATS = '[data-testid="panel-stats"]';

// =============================================================================
// Legacy Widget Detection (Deprecated - for backward compatibility)
// =============================================================================

/**
 * @deprecated Use waitForTriggerInjection instead
 * Wait for the Prompt Tuner widget to be injected into the page
 */
export async function waitForWidgetInjection(
  page: Page,
  timeout = 15000,
): Promise<void> {
  try {
    await waitForTriggerInjection(page, timeout);
  } catch (error) {
    // Fallback to old selector
    await page.waitForSelector(".prompt-tuner-widget", {
      timeout: 5000,
      state: "attached",
    });
  }
}

/**
 * @deprecated Use isTriggerVisible instead
 * Check if widget is visible
 */
export async function isWidgetVisible(page: Page): Promise<boolean> {
  return await isTriggerVisible(page);
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
      (window as any).ai = {
        languageModel: {
          availability: async () => (available ? "available" : "unavailable"),
          
          create: async (options: any) => {
            if (simulateError) {
              throw new Error("Mock AI session creation failed");
            }

            return {
              prompt: async (text: string) => {
                if (simulateError) {
                  throw new Error("Mock AI prompt failed");
                }
                return mockResponse;
              },

              promptStreaming: async function* (text: string) {
                if (simulateError) {
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
    { available, mockResponse, streamingTokens, simulateError },
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
          ${
            platform === "chatgpt"
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
      errors.push(msg.text());
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
    return (await element.inputValue()) || "";
  } else {
    return (await element.textContent()) || "";
  }
}
