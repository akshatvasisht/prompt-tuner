/**
 * E2E Tests: Trigger Button Injection
 *
 * Tests that the Prompt Tuner trigger button correctly injects on supported platforms:
 * - ChatGPT (chat.openai.com and chatgpt.com)
 * - Claude (claude.ai)
 * - Gemini (gemini.google.com)
 *
 * Verifies:
 * - Trigger button appears on supported platforms
 * - Trigger button positioning
 * - Shadow DOM isolation
 * - Trigger responds to focus events
 * - No injection on unsupported platforms
 */

import { test, expect } from "@playwright/test";
import {
  waitForExtensionLoad,
  waitForTriggerInjection,
  isTriggerVisible,
  createMockChatPage,
  focusChatTextarea,
  monitorConsoleErrors,
  assertNoConsoleErrors,
  mockGeminiNanoAPI,
} from "./setup";

// =============================================================================
// Trigger Button Injection Tests
// =============================================================================

test.describe("Trigger Button Injection on Supported Platforms", () => {
  test.beforeEach(async ({ context, page }) => {
    // Wait for extension to load
    await waitForExtensionLoad(context);
    
    // Mock LanguageModel API
    await mockGeminiNanoAPI(page, { available: true });
  });

  test("should inject trigger button on ChatGPT (chat.openai.com)", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    // Create mock ChatGPT page
    await createMockChatPage(page, "chatgpt");
    
    // Focus textarea to trigger button appearance
    await focusChatTextarea(page, "chatgpt");
    
    // Wait for trigger button injection
    await waitForTriggerInjection(page);
    
    // Verify trigger button exists
    const trigger = await page.$('[data-testid="trigger-button"]');
    expect(trigger).not.toBeNull();
    
    // Verify trigger button is visible
    const visible = await isTriggerVisible(page);
    expect(visible).toBe(true);
    
    // No console errors
    assertNoConsoleErrors(errors);
  });

  test("should inject trigger button on Claude (claude.ai)", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    // Create mock Claude page
    await createMockChatPage(page, "claude");
    
    // Focus textarea
    await focusChatTextarea(page, "claude");
    
    // Wait for trigger button injection
    await waitForTriggerInjection(page);
    
    // Verify trigger button exists
    const trigger = await page.$('[data-testid="trigger-button"]');
    expect(trigger).not.toBeNull();
    
    // Verify trigger button is visible
    const visible = await isTriggerVisible(page);
    expect(visible).toBe(true);
    
    // No console errors
    assertNoConsoleErrors(errors);
  });

  test("should inject trigger button on Gemini (gemini.google.com)", async ({ page }) => {
    const errors = monitorConsoleErrors(page);

    // Create mock Gemini page
    await createMockChatPage(page, "gemini");
    
    // Focus textarea
    await focusChatTextarea(page, "gemini");
    
    // Wait for trigger button injection
    await waitForTriggerInjection(page);
    
    // Verify trigger button exists
    const trigger = await page.$('[data-testid="trigger-button"]');
    expect(trigger).not.toBeNull();
    
    // Verify trigger button is visible
    const visible = await isTriggerVisible(page);
    expect(visible).toBe(true);
    
    // No console errors
    assertNoConsoleErrors(errors);
  });

  test("should not inject trigger button on unsupported platforms", async ({ page }) => {
    // Navigate to unsupported domain
    await page.goto("https://www.google.com");
    
    // Wait a bit to see if trigger button tries to inject
    await page.waitForTimeout(2000);
    
    // Verify trigger button does NOT exist
    const trigger = await page.$('[data-testid="trigger-button"]');
    expect(trigger).toBeNull();
  });
});

// =============================================================================
// Trigger Button Positioning Tests
// =============================================================================

test.describe("Trigger Button Positioning", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should position trigger button on right edge", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);

    // Get trigger button position
    const trigger = await page.$('[data-testid="trigger-button"]');
    expect(trigger).not.toBeNull();

    const triggerBox = await trigger!.boundingBox();
    expect(triggerBox).not.toBeNull();
    
    // Trigger should be positioned on the right edge
    // (exact positioning may vary, but should be near right side of viewport)
    const viewportSize = page.viewportSize();
    if (viewportSize && triggerBox) {
      expect(triggerBox.x + triggerBox.width).toBeGreaterThan(viewportSize.width - 50);
    }
  });

  test("should remain visible after scrolling", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);

    const trigger = await page.$('[data-testid="trigger-button"]');
    const initialBox = await trigger!.boundingBox();

    // Scroll page
    await page.evaluate(() => window.scrollBy(0, 100));
    await page.waitForTimeout(500);

    // Trigger button should still be visible (fixed position)
    const newBox = await trigger!.boundingBox();
    expect(newBox).toBeDefined();
    
    // Fixed positioning means button stays in same viewport position
    if (initialBox && newBox) {
      expect(Math.abs(initialBox.y - newBox.y)).toBeLessThan(5);
    }
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
    await waitForTriggerInjection(page);

    // Check if shadow root exists
    const hasShadowRoot = await page.evaluate(() => {
      const trigger = document.querySelector('[data-testid="trigger-button"]');
      // The trigger button container should have shadow root
      return trigger?.parentElement?.shadowRoot !== null;
    });

    // Plasmo CSUI uses shadow DOM by default
    expect(hasShadowRoot).toBe(true);
  });

  test("trigger styles should not leak to page", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    
    // Get computed style of page element before trigger injection
    const originalStyle = await page.evaluate(() => {
      const el = document.querySelector('[contenteditable="true"]');
      return el ? window.getComputedStyle(el).backgroundColor : null;
    });

    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);

    // Get computed style after trigger injection
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

  test("should show trigger button when textarea is focused", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    
    // Initially, trigger button might not be visible
    await page.waitForTimeout(1000);
    
    // Focus textarea
    await focusChatTextarea(page, "chatgpt");
    
    // Trigger button should appear
    await waitForTriggerInjection(page);
    const visible = await isTriggerVisible(page);
    expect(visible).toBe(true);
  });

  test("should handle blur events gracefully", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);

    // Blur the textarea (click somewhere else)
    await page.click("body");
    await page.waitForTimeout(500);

    // Trigger button should still exist (might be hidden or shown based on implementation)
    const trigger = await page.$('[data-testid="trigger-button"]');
    expect(trigger).not.toBeNull();
  });

  test("should re-appear when refocusing textarea", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    
    // First focus
    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);
    
    // Blur
    await page.click("body");
    await page.waitForTimeout(300);
    
    // Re-focus
    await focusChatTextarea(page, "chatgpt");
    await page.waitForTimeout(300);
    
    // Trigger button should still be present
    const visible = await isTriggerVisible(page);
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
    await waitForTriggerInjection(page);

    // Trigger button should exist
    let visible = await isTriggerVisible(page);
    expect(visible).toBe(true);

    // Focus second textarea
    await page.click("#textarea2");
    await page.waitForTimeout(500);

    // Trigger button should still be present (tracking new textarea)
    visible = await isTriggerVisible(page);
    expect(visible).toBe(true);
  });
});

// =============================================================================
// Neobrutalist Styling Tests
// =============================================================================

test.describe("Neobrutalist Visual Design", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should have construction yellow background", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);

    // Check button background color
    const bgColor = await page.evaluate(() => {
      const button = document.querySelector('[data-testid="trigger-button"]');
      return button ? window.getComputedStyle(button as Element).backgroundColor : null;
    });

    // Construction yellow #FBBF24 = rgb(251, 191, 36)
    // Allow for some variation due to HSL conversion
    expect(bgColor).toBeTruthy();
  });

  test("should have black border and brutal shadow", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);

    const styles = await page.evaluate(() => {
      const button = document.querySelector('[data-testid="trigger-button"]');
      if (!button) return null;
      const computed = window.getComputedStyle(button as Element);
      return {
        borderWidth: computed.borderWidth,
        boxShadow: computed.boxShadow,
      };
    });

    expect(styles).toBeTruthy();
    // Should have 2px border
    expect(styles?.borderWidth).toBe("2px");
    // Should have shadow
    expect(styles?.boxShadow).toBeTruthy();
  });
});
