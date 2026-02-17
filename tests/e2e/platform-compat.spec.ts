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
  createMockChatPage,
  focusChatTextarea,
  typeInChatTextarea,
  getChatTextareaContent,
  monitorConsoleErrors,
  assertNoConsoleErrors,
  mockGeminiNanoAPI,
  waitForTriggerInjection,
  selectTextInArea,
} from "./setup";
import { WIDGET_IDS } from "../../src/lib/constants";

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

    const textarea = await page.$('[contenteditable="true"][data-id="root"]');
    expect(textarea).not.toBeNull();
  });

  test("should detect Claude platform correctly", async ({ page }) => {
    await createMockChatPage(page, "claude");
    await focusChatTextarea(page, "claude");

    const textarea = await page.$('[contenteditable="true"].ProseMirror');
    expect(textarea).not.toBeNull();
  });

  test("should detect Gemini platform correctly", async ({ page }) => {
    await createMockChatPage(page, "gemini");
    await focusChatTextarea(page, "gemini");

    const textarea = await page.$("textarea");
    expect(textarea).not.toBeNull();
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
    const selector = '[contenteditable="true"][data-id="root"]';

    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "Test prompt for ChatGPT");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    // Verify content was typed
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content).toContain("Test prompt");

    // Click Mini-Pill
    const trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await trigger.click();

    // Verify Overlay
    await expect(page.locator(`[id="${WIDGET_IDS.OVERLAY_CONTAINER}"]`)).toBeVisible();

    // Select Polish and Apply
    await page.click('text="Polish"');
    await page.waitForSelector('button:has-text("Apply Changes")');
    await page.click('button:has-text("Apply Changes")');

    // Should work without errors
    assertNoConsoleErrors(errors);
  });

  test("should handle Claude ProseMirror contenteditable", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "claude");
    const selector = '[contenteditable="true"].ProseMirror';

    await focusChatTextarea(page, "claude");
    await typeInChatTextarea(page, "claude", "Test prompt for Claude");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    // Verify content
    const content = await getChatTextareaContent(page, "claude");
    expect(content).toContain("Test prompt");

    // Click Mini-Pill
    const trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await trigger.click();

    // Select Polish and Apply
    await page.waitForSelector('text="Polish"');
    await page.click('text="Polish"');
    await page.waitForSelector('button:has-text("Apply Changes")');
    await page.click('button:has-text("Apply Changes")');

    // Should work without errors
    assertNoConsoleErrors(errors);
  });

  test("should handle Gemini textarea element", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "gemini");
    const selector = "textarea#chat-input";

    await focusChatTextarea(page, "gemini");
    await typeInChatTextarea(page, "gemini", "Test prompt for Gemini");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    // Verify content
    const content = await getChatTextareaContent(page, "gemini");
    expect(content).toContain("Test prompt");

    // Click Mini-Pill
    const trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await trigger.click();

    // Select Polish and Apply
    await page.waitForSelector('text="Polish"');
    await page.click('text="Polish"');
    await page.waitForSelector('button:has-text("Apply Changes")');
    await page.click('button:has-text("Apply Changes")');

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
    const selector = '[contenteditable="true"][data-id="root"]';

    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "React controlled input test");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    // Click Mini-Pill
    const trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await trigger.click();

    // Select Polish and Apply
    await page.waitForSelector('text="Polish"');
    await page.click('text="Polish"');
    await page.waitForSelector('button:has-text("Apply Changes")');
    await page.click('button:has-text("Apply Changes")');

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
    const selector = '[contenteditable="true"][data-id="root"]';

    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "Test");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    // Click Mini-Pill
    const trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await trigger.click();

    // Select Polish and Apply
    await page.waitForSelector('text="Polish"');
    await page.click('text="Polish"');
    await page.waitForSelector('button:has-text("Apply Changes")');
    await page.click('button:has-text("Apply Changes")');

    // Check if events were triggered
    const events = await page.evaluate(() => (window as unknown as { reactEventsTriggered: string[] }).reactEventsTriggered);

    // Input events should have been triggered
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
    const selector = '[contenteditable="true"][data-id="root"]';

    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "Test navigation");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    // Trigger should be present
    let trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await expect(trigger).toBeVisible();

    // Simulate SPA navigation
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div class="container">
          <h1>New Chat</h1>
          <div contenteditable="true" data-id="root"></div>
        </div>
      `;
    });

    await page.waitForTimeout(1000);

    // Focus and select in new textarea
    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "New text");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await expect(trigger).toBeVisible();
  });

  test("should cleanup on navigation", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    const selector = '[contenteditable="true"][data-id="root"]';

    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "Test cleanup");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    // Navigate away
    await page.goto("about:blank");
    await page.waitForTimeout(1000);

    // Trigger should be gone
    const trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await expect(trigger).not.toBeVisible();
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
    const selector = '[contenteditable="true"][data-id="root"]';

    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "Test prompt");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    // Type normally should still work
    const testText = " - addition";
    await page.locator(selector).pressSequentially(testText);

    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content).toContain("Test prompt");
    expect(content).toContain("addition");
  });

  test("should not intercept keyboard shortcuts", async ({ page }) => {
    await createMockChatPage(page, "gemini");
    const selector = "textarea#chat-input";

    await focusChatTextarea(page, "gemini");
    await typeInChatTextarea(page, "gemini", "Test text");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    // Extension should not prevent standard shortcuts
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+C");

    const content = await getChatTextareaContent(page, "gemini");
    expect(content).toBe("Test text");
  });

  test("should not prevent form submission", async ({ page }) => {
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
    const selector = "textarea#chat-input";

    await focusChatTextarea(page, "gemini");
    await typeInChatTextarea(page, "gemini", "Test");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    const submitted = await page.evaluate(() => (window as unknown as { formSubmitted: boolean }).formSubmitted);
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
    const selector = '[contenteditable="true"][data-id="root"]';

    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "Test");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    await page.waitForTimeout(1000);
    assertNoConsoleErrors(errors);
  });

  test("should not produce errors during optimization", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    await createMockChatPage(page, "chatgpt");
    const selector = '[contenteditable="true"][data-id="root"]';

    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "Test prompt");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    const trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await trigger.click();
    await page.click('text="Polish"');
    await page.waitForSelector('button:has-text("Apply Changes")');
    await page.click('button:has-text("Apply Changes")');

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
    const platforms: ("chatgpt" | "claude" | "gemini")[] = [
      "chatgpt",
      "claude",
      "gemini",
    ];

    for (const platform of platforms) {
      await createMockChatPage(page, platform);
      const selectors = {
        chatgpt: '[contenteditable="true"][data-id="root"]',
        claude: '[contenteditable="true"].ProseMirror',
        gemini: 'textarea#chat-input',
      };
      const selector = selectors[platform];

      await focusChatTextarea(page, platform);
      await typeInChatTextarea(page, platform, "Test");
      await selectTextInArea(page, selector);
      await waitForTriggerInjection(page);

      const trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
      await expect(trigger).toBeVisible();
      await trigger.click();

      await page.waitForSelector('text="Polish"');
      await page.click('text="Polish"');
      await page.waitForSelector('button:has-text("Apply Changes")');
      await page.click('button:has-text("Apply Changes")');

      const content = await getChatTextareaContent(page, platform);
      expect(content).toBeTruthy();
    }
  });

  test("should use correct selectors for each platform", async ({ page }) => {
    // ChatGPT: contenteditable with data-id="root"
    await createMockChatPage(page, "chatgpt");
    await page.waitForLoadState("domcontentloaded");
    const chatgptTextarea = page.locator('[contenteditable="true"][data-id="root"]');
    await expect(chatgptTextarea).toBeVisible();

    // Claude: contenteditable with ProseMirror class
    await createMockChatPage(page, "claude");
    await page.waitForLoadState("domcontentloaded");
    const claudeTextarea = page.locator('[contenteditable="true"].ProseMirror');
    await expect(claudeTextarea).toBeVisible();

    // Gemini: standard textarea
    await createMockChatPage(page, "gemini");
    await page.waitForLoadState("domcontentloaded");
    const geminiTextarea = page.locator("textarea#chat-input, textarea[placeholder]");
    await expect(geminiTextarea.first()).toBeVisible();
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
    const selector = '[contenteditable="true"][data-id="root"]';

    // Rapidly focus and blur
    for (let i = 0; i < 3; i++) {
      await focusChatTextarea(page, "chatgpt");
      await page.waitForTimeout(100);
      await page.click("body");
      await page.waitForTimeout(100);
    }

    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "Test rapid");
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    const trigger = page.locator(`[data-testid="${WIDGET_IDS.TRIGGER_BUTTON}"]`);
    await expect(trigger).toBeVisible();
  });

  test("should handle very long text", async ({ page }) => {
    await createMockChatPage(page, "gemini");
    const selector = "textarea#chat-input";

    await focusChatTextarea(page, "gemini");
    const longText = "A".repeat(2000);
    await typeInChatTextarea(page, "gemini", longText);
    await selectTextInArea(page, selector);
    await waitForTriggerInjection(page);

    const content = await getChatTextareaContent(page, "gemini");
    expect(content.length).toBeGreaterThan(1000);
  });
});
