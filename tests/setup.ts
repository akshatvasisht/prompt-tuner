/**
 * Test Setup Configuration
 *
 * Provides global mocks for:
 * - Chrome Extension APIs (runtime, storage, alarms)
 * - Chrome Built-in AI LanguageModel API (Gemini Nano)
 */

import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// =============================================================================
// Chrome API Mocks
// =============================================================================
const mockChrome = {
  runtime: {
    id: "test-extension-id",
    getManifest: vi.fn(() => ({ version: "0.1.0" })),
    onInstalled: { addListener: vi.fn() },
    onStartup: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    OnInstalledReason: {
      INSTALL: "install",
      UPDATE: "update",
      CHROME_UPDATE: "chrome_update",
      SHARED_MODULE_UPDATE: "shared_module_update",
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
};

vi.stubGlobal("chrome", mockChrome);

// =============================================================================
// Chrome 138+ LanguageModel API Mocks
// =============================================================================

/**
 * Mock LanguageModel session
 */
const createMockSession = () => ({
  prompt: vi.fn((input: string) => Promise.resolve(`Optimized: ${input}`)),
  promptStreaming: vi.fn((input: string) => {
    const chunks = [`Optimized: `, input];
    let index = 0;
    return new ReadableStream({
      pull(controller) {
        if (index < chunks.length) {
          controller.enqueue(chunks[index]);
          index++;
        } else {
          controller.close();
        }
      },
    });
  }),
  destroy: vi.fn(),
  clone: vi.fn(),
  append: vi.fn(),
  measureInputUsage: vi.fn().mockResolvedValue(100),
  inputUsage: 0,
  inputQuota: 4096,
  topK: 40,
  temperature: 0.7,
  onquotaoverflow: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

/**
 * Mock LanguageModel global (Chrome 138+ API)
 */
const mockLanguageModel = {
  availability: vi.fn(() => Promise.resolve("available" as const)),
  params: vi.fn(() =>
    Promise.resolve({
      defaultTopK: 40,
      maxTopK: 128,
      defaultTemperature: 0.7,
      maxTemperature: 2.0,
    }),
  ),
  create: vi.fn(() => Promise.resolve(createMockSession())),
};

vi.stubGlobal("LanguageModel", mockLanguageModel);

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Helper to create a mock LanguageModel with custom behavior
 */
export function createMockLanguageModel(overrides?: {
  availability?: "available" | "downloadable" | "downloading" | "unavailable";
  promptResponse?: string;
}) {
  return {
    availability: vi.fn(() =>
      Promise.resolve(overrides?.availability ?? "available"),
    ),
    params: vi.fn(() =>
      Promise.resolve({
        defaultTopK: 40,
        maxTopK: 128,
        defaultTemperature: 0.7,
        maxTemperature: 2.0,
      }),
    ),
    create: vi.fn(() =>
      Promise.resolve({
        ...createMockSession(),
        prompt: vi.fn(() =>
          Promise.resolve(overrides?.promptResponse ?? "Optimized prompt"),
        ),
      }),
    ),
  };
}

/**
 * Helper to reset LanguageModel mock to default state
 */
export function resetLanguageModelMock() {
  vi.stubGlobal("LanguageModel", mockLanguageModel);
}
