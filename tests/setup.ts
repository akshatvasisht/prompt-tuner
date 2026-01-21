/**
 * Test Setup Configuration
 *
 * Provides global mocks for:
 * - Chrome Extension APIs (runtime, storage, alarms)
 * - Window.ai (Gemini Nano) API
 */

import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

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
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
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
}

vi.stubGlobal("chrome", mockChrome)

// =============================================================================
// Gemini Nano API Mocks
// =============================================================================
const mockAI = {
  languageModel: {
    capabilities: vi.fn(() =>
      Promise.resolve({
        available: "readily",
        defaultTemperature: 0.7,
        defaultTopK: 40,
        maxTopK: 128,
      })
    ),
    create: vi.fn(() =>
      Promise.resolve({
        prompt: vi.fn((input: string) => Promise.resolve(`Optimized: ${input}`)),
        promptStreaming: vi.fn(),
        destroy: vi.fn(),
      })
    ),
  },
}

vi.stubGlobal("ai", mockAI)
