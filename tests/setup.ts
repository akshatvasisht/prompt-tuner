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
    session: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    },
  },
  tabs: {
    create: vi.fn(),
    query: vi.fn(),
    sendMessage: vi.fn(),
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
// Writer / Rewriter / Summarizer mocks (Chrome 138+ writing assistance APIs)
// =============================================================================

const makeStream = (chunks: string[]): ReadableStream<string> => {
  let i = 0;
  return new ReadableStream<string>({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(chunks[i]);
        i++;
      } else {
        controller.close();
      }
    },
  });
};

const mockWriter = {
  availability: vi.fn().mockResolvedValue("available" as const),
  create: vi.fn(() =>
    Promise.resolve({
      write: vi.fn((input: string) => Promise.resolve(`Written: ${input}`)),
      writeStreaming: vi.fn((input: string) =>
        makeStream([`Written: `, input]),
      ),
      measureInputUsage: vi.fn().mockResolvedValue(50),
      inputQuota: 4096,
      tone: "neutral",
      format: "plain-text",
      length: "short",
      sharedContext: "",
      destroy: vi.fn(),
    }),
  ),
};

const mockRewriter = {
  availability: vi.fn().mockResolvedValue("available" as const),
  create: vi.fn(() =>
    Promise.resolve({
      rewrite: vi.fn((input: string) => Promise.resolve(`Rewritten: ${input}`)),
      rewriteStreaming: vi.fn((input: string) =>
        makeStream([`Rewritten: `, input]),
      ),
      measureInputUsage: vi.fn().mockResolvedValue(50),
      inputQuota: 4096,
      tone: "as-is",
      format: "as-is",
      length: "as-is",
      sharedContext: "",
      destroy: vi.fn(),
    }),
  ),
};

const mockSummarizer = {
  availability: vi.fn().mockResolvedValue("available" as const),
  create: vi.fn(() =>
    Promise.resolve({
      summarize: vi.fn((input: string) =>
        Promise.resolve(`Summary: ${input.slice(0, 20)}`),
      ),
      summarizeStreaming: vi.fn((input: string) =>
        makeStream([`Summary: `, input.slice(0, 20)]),
      ),
      measureInputUsage: vi.fn().mockResolvedValue(50),
      inputQuota: 4096,
      type: "teaser",
      format: "plain-text",
      length: "short",
      sharedContext: "",
      destroy: vi.fn(),
    }),
  ),
};

vi.stubGlobal("Writer", mockWriter);
vi.stubGlobal("Rewriter", mockRewriter);
vi.stubGlobal("Summarizer", mockSummarizer);

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
