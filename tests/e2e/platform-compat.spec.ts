/**
 * E2E Tests: Platform Compatibility
 *
 * Tests cross-platform compatibility and platform-specific behaviors:
 * - Platform detection (ChatGPT, Claude, Gemini)
 * - Platform-specific textarea handling
 * - SPA navigation compatibility
 * - No interference with platform functionality
 * - No console errors
 */

import { test, expect } from "@playwright/test";
import {
  waitForExtensionLoad,
  waitForWidgetInjection,
  createMockChatPage,
  focusChatTextarea,
  typeInChatTextarea,
  getChatTextareaContent,
  monitorConsoleErrors,
  assertNoConsoleErrors,
  mockGeminiNanoAPI,
} from "./setup";

// =============================================================================
// Platform Detection Tests
// =============================================================================

test.describe("Platform Detection", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should detect ChatGPT platform correctly", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Check that widget uses ChatGPT-specific selector
    const textarea = await page.$('[contenteditable="true"][data-id="root"]');
    expect(textarea).not.toBeNull();

    // Widget should be present
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });

  test("should detect Claude platform correctly", async ({ page }) => {
    await createMockChatPage(page, "claude");
    await focusChatTextarea(page, "claude");
    await waitForWidgetInjection(page);

    // Check that widget uses Claude-specific selector
    const textarea = await page.$('[contenteditable="true"].ProseMirror');
    expect(textarea).not.toBeNull();

    // Widget should be present
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });

  test("should detect Gemini platform correctly", async ({ page }) => {
    await createMockChatPage(page, "gemini");
    await focusChatTextarea(page, "gemini");
    await waitForWidgetInjection(page);

    // Check that widget uses Gemini-specific selector
    const textarea = await page.$("textarea");
    expect(textarea).not.toBeNull();

    // Widget should be present
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });
});

// =============================================================================
// Platform-Specific Textarea Handling Tests
// =============================================================================

test.describe("Platform-Specific Textarea Handling", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page, {
      available: true,
      mockResponse: "Platform-specific optimized text",
    });
  });

  test("should handle ChatGPT contenteditable div", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Type in contenteditable
    await typeInChatTextarea(page, "chatgpt", "Test prompt for ChatGPT");
    await page.waitForTimeout(500);

    // Verify content was typed
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content).toContain("ChatGPT");

    // Optimize
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();
    await page.waitForTimeout(3000);

    // Should work without errors
    assertNoConsoleErrors(errors);
  });

  test("should handle Claude ProseMirror contenteditable", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "claude");
    await focusChatTextarea(page, "claude");
    await waitForWidgetInjection(page);

    // Type in ProseMirror
    await typeInChatTextarea(page, "claude", "Test prompt for Claude");
    await page.waitForTimeout(500);

    // Verify content
    const content = await getChatTextareaContent(page, "claude");
    expect(content).toContain("Claude");

    // Optimize
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();
    await page.waitForTimeout(3000);

    // Should work without errors
    assertNoConsoleErrors(errors);
  });

  test("should handle Gemini textarea element", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "gemini");
    await focusChatTextarea(page, "gemini");
    await waitForWidgetInjection(page);

    // Type in textarea
    await typeInChatTextarea(page, "gemini", "Test prompt for Gemini");
    await page.waitForTimeout(500);

    // Verify content
    const content = await getChatTextareaContent(page, "gemini");
    expect(content).toContain("Gemini");

    // Optimize
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();
    await page.waitForTimeout(3000);

    // Should work without errors
    assertNoConsoleErrors(errors);
  });
});

// =============================================================================
// React-Controlled Input Tests
// =============================================================================

test.describe("React-Controlled Input Compatibility", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page, {
      available: true,
      mockResponse: "Optimized text via Main World bridge",
    });
  });

  test("should work with React Virtual DOM on ChatGPT", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Type text
    await typeInChatTextarea(page, "chatgpt", "React controlled input test");
    
    // Optimize
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();
    await page.waitForTimeout(3000);

    // Text replacement should work despite React
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content.length).toBeGreaterThan(0);
  });

  test("should trigger React input events correctly", async ({ page }) => {
    // Create page with React-like event tracking
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            window.reactEventsTriggered = [];
            window.addEventListener('DOMContentLoaded', () => {
              const input = document.querySelector('[contenteditable="true"]');
              input.addEventListener('input', () => {
                window.reactEventsTriggered.push('input');
              });
              input.addEventListener('change', () => {
                window.reactEventsTriggered.push('change');
              });
            });
          </script>
        </head>
        <body>
          <div contenteditable="true" data-id="root"></div>
        </body>
      </html>
    `);

    await page.waitForLoadState("domcontentloaded");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Test");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();
    await page.waitForTimeout(3000);

    // Check if events were triggered
    const events = await page.evaluate(() => (window as any).reactEventsTriggered);
    
    // Input events should have been triggered during typing
    expect(events.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// SPA Navigation Tests
// =============================================================================

test.describe("SPA Navigation Compatibility", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should handle page navigation without breaking", async ({ page }) => {
    // Create initial page
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Widget should be present
    let widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();

    // Simulate SPA navigation (change content without page reload)
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div class="container">
          <h1>New Chat</h1>
          <div contenteditable="true" data-id="root"></div>
        </div>
      `;
    });

    await page.waitForTimeout(1000);

    // Focus new textarea
    await focusChatTextarea(page, "chatgpt");
    await page.waitForTimeout(1000);

    // Widget should re-inject or still be present
    widget = await page.$('[data-testid="widget-container"]');
    
    // Widget might need to re-inject, give it time
    if (!widget) {
      await waitForWidgetInjection(page);
      widget = await page.$('[data-testid="widget-container"]');
    }
    
    expect(widget).not.toBeNull();
  });

  test("should cleanup on navigation", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Navigate to different page
    await page.goto("about:blank");
    await page.waitForTimeout(1000);

    // Widget should be gone
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).toBeNull();
  });
});

// =============================================================================
// Platform Functionality Tests
// =============================================================================

test.describe("No Interference with Platform Functionality", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should not block typing in textarea", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Type normally
    const testText = "This is a test message that should work normally";
    await typeInChatTextarea(page, "chatgpt", testText);
    await page.waitForTimeout(500);

    // Verify text was typed correctly
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content).toContain("test message");
  });

  test("should not intercept keyboard shortcuts", async ({ page }) => {
    await createMockChatPage(page, "gemini");
    await focusChatTextarea(page, "gemini");
    await waitForWidgetInjection(page);

    // Type some text
    await typeInChatTextarea(page, "gemini", "Test text");
    
    // Try Ctrl+A (select all)
    await page.keyboard.press("Control+A");
    await page.waitForTimeout(200);

    // Try Ctrl+C (copy)
    await page.keyboard.press("Control+C");
    await page.waitForTimeout(200);

    // Extension should not interfere
    const content = await getChatTextareaContent(page, "gemini");
    expect(content).toBe("Test text");
  });

  test("should not prevent form submission", async ({ page }) => {
    // Create page with form
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="testForm">
            <textarea id="chat-input"></textarea>
            <button type="submit">Send</button>
          </form>
          <script>
            window.formSubmitted = false;
            document.getElementById('testForm').addEventListener('submit', (e) => {
              e.preventDefault();
              window.formSubmitted = true;
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForLoadState("domcontentloaded");
    await focusChatTextarea(page, "gemini");
    await waitForWidgetInjection(page);

    // Type and submit
    await typeInChatTextarea(page, "gemini", "Test");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Check if form was submitted
    const submitted = await page.evaluate(() => (window as any).formSubmitted);
    expect(submitted).toBe(true);
  });
});

// =============================================================================
// Console Error Tests
// =============================================================================

test.describe("No Console Errors", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should not produce console errors on ChatGPT", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Test");
    await page.waitForTimeout(1000);

    assertNoConsoleErrors(errors);
  });

  test("should not produce console errors on Claude", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "claude");
    await focusChatTextarea(page, "claude");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "claude", "Test");
    await page.waitForTimeout(1000);

    assertNoConsoleErrors(errors);
  });

  test("should not produce console errors on Gemini", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "gemini");
    await focusChatTextarea(page, "gemini");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "gemini", "Test");
    await page.waitForTimeout(1000);

    assertNoConsoleErrors(errors);
  });

  test("should not produce errors during optimization", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Test prompt");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();
    await page.waitForTimeout(3000);

    assertNoConsoleErrors(errors);
  });
});

// =============================================================================
// Cross-Platform Consistency Tests
// =============================================================================

test.describe("Cross-Platform Consistency", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page, {
      available: true,
      mockResponse: "Consistent optimized output",
    });
  });

  test("should provide consistent behavior across platforms", async ({ page }) => {
    const platforms: Array<"chatgpt" | "claude" | "gemini"> = [
      "chatgpt",
      "claude",
      "gemini",
    ];

    for (const platform of platforms) {
      // Test each platform
      await createMockChatPage(page, platform);
      await focusChatTextarea(page, platform);
      await waitForWidgetInjection(page);

      // Widget should exist
      const widget = await page.$('[data-testid="widget-container"]');
      expect(widget).not.toBeNull();

      // Type and optimize
      await typeInChatTextarea(page, platform, "Test");
      const optimizeButton = await page.$('[data-testid="optimize-button"]');
      await optimizeButton!.click();
      await page.waitForTimeout(2000);

      // Should complete without errors
      const widgetAfter = await page.$('[data-testid="widget-container"]');
      expect(widgetAfter).not.toBeNull();
    }
  });

  test("should use correct selectors for each platform", async ({ page }) => {
    // ChatGPT: contenteditable with data-id="root"
    await createMockChatPage(page, "chatgpt");
    await page.waitForLoadState("domcontentloaded");
    let textarea = await page.$('[contenteditable="true"][data-id="root"]');
    expect(textarea).not.toBeNull();

    // Claude: contenteditable with ProseMirror class
    await createMockChatPage(page, "claude");
    await page.waitForLoadState("domcontentloaded");
    textarea = await page.$('[contenteditable="true"].ProseMirror');
    expect(textarea).not.toBeNull();

    // Gemini: standard textarea
    await createMockChatPage(page, "gemini");
    await page.waitForLoadState("domcontentloaded");
    textarea = await page.$("textarea");
    expect(textarea).not.toBeNull();
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

test.describe("Edge Cases", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should handle rapid focus changes", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    
    // Rapidly focus and blur
    for (let i = 0; i < 5; i++) {
      await focusChatTextarea(page, "chatgpt");
      await page.waitForTimeout(100);
      await page.click("body");
      await page.waitForTimeout(100);
    }

    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Widget should still work
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });

  test("should handle very long text", async ({ page }) => {
    await createMockChatPage(page, "gemini");
    await focusChatTextarea(page, "gemini");
    await waitForWidgetInjection(page);

    // Type very long text
    const longText = "A".repeat(5000);
    await typeInChatTextarea(page, "gemini", longText);
    await page.waitForTimeout(500);

    // Verify it was typed
    const content = await getChatTextareaContent(page, "gemini");
    expect(content.length).toBeGreaterThan(4000);
  });

  test("should handle special characters", async ({ page }) => {
    await createMockChatPage(page, "gemini");
    await focusChatTextarea(page, "gemini");
    await waitForWidgetInjection(page);

    // Type special characters
    const specialText = "Test with émojis 🚀 and symbols @#$%^&*()";
    await typeInChatTextarea(page, "gemini", specialText);
    await page.waitForTimeout(500);

    // Verify it was typed correctly
    const content = await getChatTextareaContent(page, "gemini");
    expect(content).toContain("émojis");
    expect(content).toContain("🚀");
  });
});
