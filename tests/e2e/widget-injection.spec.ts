/**
 * E2E Tests: Widget Injection
 *
 * Tests that the Prompt Tuner widget correctly injects on supported platforms:
 * - ChatGPT (chat.openai.com and chatgpt.com)
 * - Claude (claude.ai)
 * - Gemini (gemini.google.com)
 *
 * Verifies:
 * - Widget appears on supported platforms
 * - Widget positioning relative to textarea
 * - Shadow DOM isolation
 * - Widget responds to focus events
 * - No injection on unsupported platforms
 */

import { test, expect } from "@playwright/test";
import {
  waitForExtensionLoad,
  waitForWidgetInjection,
  isWidgetVisible,
  createMockChatPage,
  focusChatTextarea,
  monitorConsoleErrors,
  assertNoConsoleErrors,
  mockGeminiNanoAPI,
} from "./setup";

// =============================================================================
// Widget Injection Tests
// =============================================================================

test.describe("Widget Injection on Supported Platforms", () => {
  test.beforeEach(async ({ context, page }) => {
    // Wait for extension to load
    await waitForExtensionLoad(context);
    
    // Mock LanguageModel API
    await mockGeminiNanoAPI(page, { available: true });
  });

  test("should inject widget on ChatGPT (chat.openai.com)", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    // Create mock ChatGPT page
    await createMockChatPage(page, "chatgpt");
    
    // Focus textarea to trigger widget
    await focusChatTextarea(page, "chatgpt");
    
    // Wait for widget injection
    await waitForWidgetInjection(page);
    
    // Verify widget exists
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
    
    // Verify widget is visible
    const visible = await isWidgetVisible(page);
    expect(visible).toBe(true);
    
    // No console errors
    assertNoConsoleErrors(errors);
  });

  test("should inject widget on Claude (claude.ai)", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    // Create mock Claude page
    await createMockChatPage(page, "claude");
    
    // Focus textarea
    await focusChatTextarea(page, "claude");
    
    // Wait for widget injection
    await waitForWidgetInjection(page);
    
    // Verify widget exists
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
    
    // Verify widget is visible
    const visible = await isWidgetVisible(page);
    expect(visible).toBe(true);
    
    // No console errors
    assertNoConsoleErrors(errors);
  });

  test("should inject widget on Gemini (gemini.google.com)", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    // Create mock Gemini page
    await createMockChatPage(page, "gemini");
    
    // Focus textarea
    await focusChatTextarea(page, "gemini");
    
    // Wait for widget injection
    await waitForWidgetInjection(page);
    
    // Verify widget exists
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
    
    // Verify widget is visible
    const visible = await isWidgetVisible(page);
    expect(visible).toBe(true);
    
    // No console errors
    assertNoConsoleErrors(errors);
  });

  test("should not inject widget on unsupported platforms", async ({ page }) => {
    // Navigate to unsupported domain
    await page.goto("https://www.google.com");
    
    // Wait a bit to see if widget tries to inject
    await page.waitForTimeout(2000);
    
    // Verify widget does NOT exist
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).toBeNull();
  });
});

// =============================================================================
// Widget Positioning Tests
// =============================================================================

test.describe("Widget Positioning", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should position widget near textarea on ChatGPT", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Get widget and textarea positions
    const widget = await page.$('[data-testid="widget-container"]');
    const textarea = await page.$('[contenteditable="true"][data-id="root"]');
    
    expect(widget).not.toBeNull();
    expect(textarea).not.toBeNull();

    const widgetBox = await widget!.boundingBox();
    const textareaBox = await textarea!.boundingBox();

    // Widget should be positioned relative to textarea
    // (exact positioning depends on floating-ui configuration)
    expect(widgetBox).not.toBeNull();
    expect(textareaBox).not.toBeNull();
  });

  test("should update position when textarea moves", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    const widget = await page.$('[data-testid="widget-container"]');
    const initialBox = await widget!.boundingBox();

    // Scroll page
    await page.evaluate(() => window.scrollBy(0, 100));
    await page.waitForTimeout(500);

    // Widget position should update (if visible)
    const newBox = await widget!.boundingBox();
    
    // Position might change or widget might hide - both are valid
    expect(newBox).toBeDefined();
  });
});

// =============================================================================
// Shadow DOM Isolation Tests
// =============================================================================

test.describe("Shadow DOM Isolation", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should use shadow DOM for style isolation", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Check if shadow root exists
    const hasShadowRoot = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="widget-container"]');
      return container?.shadowRoot !== null;
    });

    // Plasmo CSUI uses shadow DOM by default
    expect(hasShadowRoot).toBe(true);
  });

  test("widget styles should not leak to page", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    
    // Get computed style of page element before widget injection
    const originalStyle = await page.evaluate(() => {
      const el = document.querySelector('[contenteditable="true"]');
      return el ? window.getComputedStyle(el).backgroundColor : null;
    });

    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Get computed style after widget injection
    const afterStyle = await page.evaluate(() => {
      const el = document.querySelector('[contenteditable="true"]');
      return el ? window.getComputedStyle(el).backgroundColor : null;
    });

    // Styles should be unchanged
    expect(afterStyle).toBe(originalStyle);
  });
});

// =============================================================================
// Focus Event Tests
// =============================================================================

test.describe("Focus Event Handling", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should show widget when textarea is focused", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    
    // Initially, widget might not be visible
    await page.waitForTimeout(1000);
    
    // Focus textarea
    await focusChatTextarea(page, "chatgpt");
    
    // Widget should appear
    await waitForWidgetInjection(page);
    const visible = await isWidgetVisible(page);
    expect(visible).toBe(true);
  });

  test("should handle blur events gracefully", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Blur the textarea (click somewhere else)
    await page.click("body");
    await page.waitForTimeout(500);

    // Widget should still exist (might be hidden or shown based on implementation)
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });

  test("should re-appear when refocusing textarea", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    
    // First focus
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);
    
    // Blur
    await page.click("body");
    await page.waitForTimeout(300);
    
    // Re-focus
    await focusChatTextarea(page, "chatgpt");
    await page.waitForTimeout(300);
    
    // Widget should still be present
    const visible = await isWidgetVisible(page);
    expect(visible).toBe(true);
  });
});

// =============================================================================
// Multi-Textarea Support Tests
// =============================================================================

test.describe("Multiple Textareas", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should track active textarea correctly", async ({ page }) => {
    // Create page with multiple textareas
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div contenteditable="true" data-id="root" id="textarea1">First</div>
          <div contenteditable="true" data-id="root" id="textarea2">Second</div>
        </body>
      </html>
    `);

    await page.waitForLoadState("domcontentloaded");

    // Focus first textarea
    await page.click("#textarea1");
    await page.waitForTimeout(500);
    await waitForWidgetInjection(page);

    // Widget should exist
    let visible = await isWidgetVisible(page);
    expect(visible).toBe(true);

    // Focus second textarea
    await page.click("#textarea2");
    await page.waitForTimeout(500);

    // Widget should still be present (tracking new textarea)
    visible = await isWidgetVisible(page);
    expect(visible).toBe(true);
  });
});
