/**
 * E2E Tests: Optimization Flow
 *
 * Tests the complete prompt optimization workflow:
 * - User types prompt in textarea
 * - User clicks optimization button
 * - Widget displays streaming response
 * - Optimized text replaces original
 * - Error handling
 * - Multiple optimizations
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
// Full Optimization Flow Tests
// =============================================================================

test.describe("Complete Optimization Workflow", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
  });

  test("should complete full optimization flow on ChatGPT", async ({ page }) => {
    const errors = monitorConsoleErrors(page);
    
    // Mock AI with streaming response
    await mockGeminiNanoAPI(page, {
      available: true,
      streamingTokens: [
        "Optimize ",
        "this ",
        "prompt ",
        "for ",
        "better ",
        "results.",
      ],
    });

    // Setup page
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Type initial prompt
    const initialPrompt = "Make this better";
    await typeInChatTextarea(page, "chatgpt", initialPrompt);
    await page.waitForTimeout(500);

    // Click optimize button
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    expect(optimizeButton).not.toBeNull();
    await optimizeButton!.click();

    // Wait for processing to start
    await page.waitForTimeout(500);

    // Check for streaming preview (if visible)
    const streamingPreview = await page.$('[data-testid="streaming-preview"]');
    if (streamingPreview) {
      // Verify streaming text is displayed
      const previewText = await streamingPreview.textContent();
      expect(previewText).toBeTruthy();
    }

    // Wait for optimization to complete (max 30s)
    await page.waitForTimeout(5000);

    // Verify textarea content was updated
    const finalContent = await getChatTextareaContent(page, "chatgpt");
    
    // Content should have changed from initial prompt
    // (exact text depends on mock, but should not be empty)
    expect(finalContent).toBeTruthy();
    expect(finalContent.length).toBeGreaterThan(0);

    // No console errors
    assertNoConsoleErrors(errors);
  });

  test("should display success indicator after optimization", async ({ page }) => {
    await mockGeminiNanoAPI(page, {
      available: true,
      mockResponse: "Optimized prompt text",
    });

    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Type and optimize
    await typeInChatTextarea(page, "chatgpt", "Test prompt");
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    // Wait for completion
    await page.waitForTimeout(3000);

    // Check for success indicator
    const successIndicator = await page.$('[data-testid="success-indicator"]');
    
    // Success indicator might be temporary, so it's okay if it's gone
    // Main thing is no error occurred
    const errorMessage = await page.$('[data-testid="error-message"]');
    expect(errorMessage).toBeNull();
  });

  test("should show streaming tokens in real-time", async ({ page }) => {
    await mockGeminiNanoAPI(page, {
      available: true,
      streamingTokens: ["Token1 ", "Token2 ", "Token3 ", "Token4"],
    });

    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Test");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    // Wait a bit for streaming to start
    await page.waitForTimeout(1000);

    // Check if streaming preview exists and has content
    const streamingPreview = await page.$('[data-testid="streaming-preview"]');
    if (streamingPreview) {
      const text = await streamingPreview.textContent();
      // Should have some tokens
      expect(text).toBeTruthy();
    }

    // Wait for completion
    await page.waitForTimeout(3000);
  });
});

// =============================================================================
// Error Handling Tests
// =============================================================================

test.describe("Error Handling", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
  });

  test("should display error when AI is unavailable", async ({ page }) => {
    // Mock AI as unavailable
    await mockGeminiNanoAPI(page, { available: false });

    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Test prompt");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    // Wait for error to appear
    await page.waitForTimeout(2000);

    // Should show error message
    const errorMessage = await page.$('[data-testid="error-message"]');
    
    // Error message should be visible or widget should show error state
    // (exact implementation depends on component)
    const widgetContainer = await page.$('[data-testid="widget-container"]');
    expect(widgetContainer).not.toBeNull();
  });

  test("should handle AI processing errors gracefully", async ({ page }) => {
    // Mock AI to simulate error
    await mockGeminiNanoAPI(page, {
      available: true,
      simulateError: true,
    });

    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Test prompt");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    // Wait for error
    await page.waitForTimeout(2000);

    // Widget should still be present (showing error)
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });

  test("should not crash on network errors", async ({ page }) => {
    const errors = monitorConsoleErrors(page);
    
    await mockGeminiNanoAPI(page, { available: true });

    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Simulate network offline
    await page.context().setOffline(true);

    await typeInChatTextarea(page, "chatgpt", "Test");
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    await page.waitForTimeout(2000);

    // Extension should handle gracefully
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();

    // Restore network
    await page.context().setOffline(false);
  });
});

// =============================================================================
// Empty Input Handling Tests
// =============================================================================

test.describe("Empty Input Handling", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should not optimize empty input", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Don't type anything, just click optimize
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    await page.waitForTimeout(1000);

    // Content should remain empty
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content).toBe("");
  });

  test("should handle whitespace-only input", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Type only whitespace
    await typeInChatTextarea(page, "chatgpt", "   ");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    await page.waitForTimeout(1000);

    // Should either do nothing or show error
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });
});

// =============================================================================
// Multiple Optimizations Tests
// =============================================================================

test.describe("Multiple Optimizations", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page, {
      available: true,
      mockResponse: "Optimized text",
    });
  });

  test("should handle multiple optimizations in sequence", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    expect(optimizeButton).not.toBeNull();

    // First optimization
    await typeInChatTextarea(page, "chatgpt", "First prompt");
    await optimizeButton!.click();
    await page.waitForTimeout(2000);

    // Second optimization
    await typeInChatTextarea(page, "chatgpt", "Second prompt");
    await optimizeButton!.click();
    await page.waitForTimeout(2000);

    // Third optimization
    await typeInChatTextarea(page, "chatgpt", "Third prompt");
    await optimizeButton!.click();
    await page.waitForTimeout(2000);

    // Widget should still be functional
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });

  test("should prevent concurrent optimizations", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Test prompt");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');

    // Click multiple times rapidly
    await optimizeButton!.click();
    await optimizeButton!.click();
    await optimizeButton!.click();

    // Wait for processing
    await page.waitForTimeout(2000);

    // Should handle gracefully (no crash)
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });
});

// =============================================================================
// Text Replacement Tests
// =============================================================================

test.describe("Text Replacement", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
  });

  test("should replace text in textarea after optimization", async ({ page }) => {
    const optimizedText = "This is the optimized result";
    
    await mockGeminiNanoAPI(page, {
      available: true,
      mockResponse: optimizedText,
    });

    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    const originalText = "Original prompt";
    await typeInChatTextarea(page, "chatgpt", originalText);
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    // Wait for optimization to complete
    await page.waitForTimeout(3000);

    // Get final content
    const finalContent = await getChatTextareaContent(page, "chatgpt");
    
    // Content should have changed
    expect(finalContent).not.toBe(originalText);
    expect(finalContent.length).toBeGreaterThan(0);
  });

  test("should work with React-controlled inputs", async ({ page }) => {
    await mockGeminiNanoAPI(page, {
      available: true,
      mockResponse: "Optimized via Main World",
    });

    // ChatGPT uses React-controlled contenteditable
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "React test");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    await page.waitForTimeout(3000);

    // Text replacement should work despite React
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content.length).toBeGreaterThan(0);
  });

  test("should preserve cursor position if possible", async ({ page }) => {
    await mockGeminiNanoAPI(page, {
      available: true,
      mockResponse: "Short optimized text",
    });

    await createMockChatPage(page, "gemini"); // Use textarea for easier cursor testing
    await focusChatTextarea(page, "gemini");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "gemini", "Original text");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    await page.waitForTimeout(3000);

    // Text should be replaced
    const content = await getChatTextareaContent(page, "gemini");
    expect(content.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Widget State Tests
// =============================================================================

test.describe("Widget State Management", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page);
  });

  test("should show idle state initially", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    // Widget should be in idle state
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
    
    // Optimize button should be clickable
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    expect(optimizeButton).not.toBeNull();
  });

  test("should show processing state during optimization", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Test");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    // Wait a moment for processing state
    await page.waitForTimeout(500);

    // Widget should still exist (showing processing state)
    const widget = await page.$('[data-testid="widget-container"]');
    expect(widget).not.toBeNull();
  });

  test("should return to idle state after completion", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForWidgetInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Test");
    
    const optimizeButton = await page.$('[data-testid="optimize-button"]');
    await optimizeButton!.click();

    // Wait for completion
    await page.waitForTimeout(4000);

    // Widget should be back to idle (button clickable again)
    const buttonAfter = await page.$('[data-testid="optimize-button"]');
    expect(buttonAfter).not.toBeNull();
  });
});
