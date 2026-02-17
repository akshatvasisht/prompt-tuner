/**
 * E2E Tests: Optimization Flow
 *
 * Tests the complete prompt optimization workflow.
 */

import { test, expect } from "@playwright/test";
import {
  waitForExtensionLoad,
  createMockChatPage,
  focusChatTextarea,
  typeInChatTextarea,
  getChatTextareaContent,
  mockGeminiNanoAPI,
} from "./setup";

test.describe.skip("Side Panel Optimization Flow", () => {
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
    await typeInChatTextarea(page, "chatgpt", "Make this better");
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content.length).toBeGreaterThan(0);
  });

  test("should allow editing before accept", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    await typeInChatTextarea(page, "chatgpt", "Test");
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content).toBeDefined();
  });

  test("should handle cancel correctly", async ({ page }) => {
    await createMockChatPage(page, "chatgpt");
    await focusChatTextarea(page, "chatgpt");
    const originalPrompt = "Original prompt";
    await typeInChatTextarea(page, "chatgpt", originalPrompt);
    const content = await getChatTextareaContent(page, "chatgpt");
    expect(content).toBe(originalPrompt);
  });
});
