import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  detectPlatform,
  isSupportedPlatform,
  getPlatformDisplayName,
  getPlatformInputSelectors,
} from "~lib/platform-detector"

describe("platform-detector", () => {
  const originalWindow = global.window

  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(global, "window", {
      value: {
        location: {
          hostname: "",
          href: "",
        },
      },
      writable: true,
    })
  })

  afterEach(() => {
    global.window = originalWindow
  })

  describe("detectPlatform", () => {
    it("should detect ChatGPT (chatgpt.com)", () => {
      window.location.hostname = "chatgpt.com"
      window.location.href = "https://chatgpt.com/c/123"

      expect(detectPlatform()).toBe("openai")
    })

    it("should detect ChatGPT (chat.openai.com)", () => {
      window.location.hostname = "chat.openai.com"
      window.location.href = "https://chat.openai.com/"

      expect(detectPlatform()).toBe("openai")
    })

    it("should detect Claude (claude.ai)", () => {
      window.location.hostname = "claude.ai"
      window.location.href = "https://claude.ai/chat"

      expect(detectPlatform()).toBe("anthropic")
    })

    it("should detect Gemini (gemini.google.com)", () => {
      window.location.hostname = "gemini.google.com"
      window.location.href = "https://gemini.google.com/app"

      expect(detectPlatform()).toBe("google")
    })

    it("should detect Bard (bard.google.com)", () => {
      window.location.hostname = "bard.google.com"
      window.location.href = "https://bard.google.com/"

      expect(detectPlatform()).toBe("google")
    })

    it("should return unknown for unsupported sites", () => {
      window.location.hostname = "example.com"
      window.location.href = "https://example.com/"

      expect(detectPlatform()).toBe("unknown")
    })

    it("should return unknown when window is undefined", () => {
      // @ts-expect-error - testing undefined window
      global.window = undefined

      expect(detectPlatform()).toBe("unknown")
    })
  })

  describe("isSupportedPlatform", () => {
    it("should return true for ChatGPT", () => {
      window.location.hostname = "chatgpt.com"
      window.location.href = "https://chatgpt.com/"

      expect(isSupportedPlatform()).toBe(true)
    })

    it("should return true for Claude", () => {
      window.location.hostname = "claude.ai"
      window.location.href = "https://claude.ai/"

      expect(isSupportedPlatform()).toBe(true)
    })

    it("should return false for unsupported sites", () => {
      window.location.hostname = "google.com"
      window.location.href = "https://google.com/"

      expect(isSupportedPlatform()).toBe(false)
    })
  })

  describe("getPlatformDisplayName", () => {
    it("should return ChatGPT for openai", () => {
      expect(getPlatformDisplayName("openai")).toBe("ChatGPT")
    })

    it("should return Claude for anthropic", () => {
      expect(getPlatformDisplayName("anthropic")).toBe("Claude")
    })

    it("should return Gemini for google", () => {
      expect(getPlatformDisplayName("google")).toBe("Gemini")
    })

    it("should return Unknown for unknown platform", () => {
      expect(getPlatformDisplayName("unknown")).toBe("Unknown")
    })
  })

  describe("getPlatformInputSelectors", () => {
    it("should return selectors for openai", () => {
      const selectors = getPlatformInputSelectors("openai")

      expect(selectors).toContain("#prompt-textarea")
      expect(selectors.some(s => s.includes("textarea"))).toBe(true)
    })

    it("should return selectors for anthropic", () => {
      const selectors = getPlatformInputSelectors("anthropic")

      expect(selectors.some(s => s.includes("ProseMirror"))).toBe(true)
      expect(selectors.some(s => s.includes("contenteditable"))).toBe(true)
    })

    it("should return selectors for google", () => {
      const selectors = getPlatformInputSelectors("google")

      expect(selectors.some(s => s.includes("textarea"))).toBe(true)
    })

    it("should return generic selectors for unknown platform", () => {
      const selectors = getPlatformInputSelectors("unknown")

      expect(selectors).toContain("textarea")
      expect(selectors.some(s => s.includes("contenteditable"))).toBe(true)
    })
  })
})
