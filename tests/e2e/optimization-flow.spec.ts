/**
 * E2E Tests: Optimization Flow with Side Panel
 *
 * Tests the complete prompt optimization workflow with the new side panel architecture
 */

import { test, expect } from "@playwright/test";
import {
  waitForExtensionLoad,
  waitForTriggerInjection,
  createMockChatPage,
  focusChatTextarea,
  typeInChatTextarea,
  getChatTextareaContent,
  mockGeminiNanoAPI,
  openSidePanel,
  PANEL_OPTIMIZE_BUTTON,
  PANEL_ACCEPT_BUTTON,
  PANEL_CANCEL_BUTTON,
  PANEL_ORIGINAL_TEXT,
  PANEL_OPTIMIZED_TEXT,
} from "./setup";

test.describe("Side Panel Optimization Flow", () => {
  test.beforeEach(async ({ context, page }) => {
    await waitForExtensionLoad(context);
    await mockGeminiNanoAPI(page, {
      available: true,
      mockResponse: "Optimized test prompt with better clarity",
    });
  });

  test("should complete full optimization flow", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);

    await typeInChatTextarea(page, "chatgpt", "Make this better");
    const panel = await openSidePanel(page);
    
    await panel.click(PANEL_OPTIMIZE_BUTTON);
    await panel.waitForTimeout(3000);
    await panel.click(PANEL_ACCEPT_BUTTON);
    await page.waitForTimeout(1000);

    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content.length).toBeGreaterThan(0);
  });

  test("should allow editing before accept", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);
    await typeInChatTextarea(page, "chatgpt", "Test");

    const panel = await openSidePanel(page);
    await panel.click(PANEL_OPTIMIZE_BUTTON);
    await panel.waitForTimeout(3000);
    
    const textarea = await panel.$(PANEL_OPTIMIZED_TEXT);
    await textarea!.fill("Manually edited text");
    await panel.click(PANEL_ACCEPT_BUTTON);
    await page.waitForTimeout(1000);
    
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content).toContain("Manually edited");
  });

  test("should handle cancel correctly", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await waitForTriggerInjection(page);
    
    const originalPrompt = "Original prompt";
    await typeInChatTextarea(page, "chatgpt", originalPrompt);

    const panel = await openSidePanel(page);
    await panel.click(PANEL_OPTIMIZE_BUTTON);
    await panel.waitForTimeout(3000);
    await panel.click(PANEL_CANCEL_BUTTON);
    
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content).toBe(originalPrompt);
  });
});
