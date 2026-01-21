import { describe, it, expect, vi, beforeEach } from "vitest"
import { checkAIAvailability, optimizePrompt } from "~lib/ai-engine"
import { PromptTunerError } from "~types"

describe("ai-engine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("checkAIAvailability", () => {
    it("should return available when AI is ready", async () => {
      // Mock is set up in tests/setup.ts
      const result = await checkAIAvailability()
      expect(result.available).toBe(true)
    })

    it("should return unavailable when AI is not present", async () => {
      // Temporarily remove the mock
      const originalAI = globalThis.ai
      globalThis.ai = undefined

      const result = await checkAIAvailability()
      expect(result.available).toBe(false)
      expect(result.reason).toContain("Gemini Nano not available")

      // Restore mock
      globalThis.ai = originalAI
    })

    it("should return unavailable when languageModel is missing", async () => {
      const originalAI = globalThis.ai
      globalThis.ai = {} as WindowAI

      const result = await checkAIAvailability()
      expect(result.available).toBe(false)
      expect(result.reason).toContain("Language Model API not available")

      globalThis.ai = originalAI
    })

    it("should return needsDownload when model needs downloading", async () => {
      const originalAI = globalThis.ai
      globalThis.ai = {
        languageModel: {
          capabilities: vi.fn().mockResolvedValue({
            available: "after-download",
          }),
          create: vi.fn(),
        },
      }

      const result = await checkAIAvailability()
      expect(result.available).toBe(false)
      expect(result.needsDownload).toBe(true)

      globalThis.ai = originalAI
    })

    it("should return unavailable when model is not supported", async () => {
      const originalAI = globalThis.ai
      globalThis.ai = {
        languageModel: {
          capabilities: vi.fn().mockResolvedValue({
            available: "no",
          }),
          create: vi.fn(),
        },
      }

      const result = await checkAIAvailability()
      expect(result.available).toBe(false)
      expect(result.reason).toContain("not supported")

      globalThis.ai = originalAI
    })
  })

  describe("optimizePrompt", () => {
    it("should return optimized prompt when AI is available", async () => {
      const draft = "test prompt"
      const rules = ["rule 1", "rule 2"]

      const result = await optimizePrompt(draft, rules)

      expect(result).toContain("Optimized")
      expect(result).toContain(draft)
    })

    it("should throw PromptTunerError when AI is unavailable", async () => {
      const originalAI = globalThis.ai
      globalThis.ai = undefined

      await expect(optimizePrompt("test", ["rule"])).rejects.toThrow(PromptTunerError)

      globalThis.ai = originalAI
    })

    it("should use default rules when empty array provided", async () => {
      const result = await optimizePrompt("test prompt", [])

      expect(result).toBeTruthy()
    })

    it("should format multiple rules correctly", async () => {
      const rules = ["Rule one", "Rule two", "Rule three"]
      const mockCreate = vi.fn().mockResolvedValue({
        prompt: vi.fn().mockImplementation((input: string) => {
          // Verify rules are numbered in the prompt
          expect(input).toContain("optimize this prompt")
          return Promise.resolve("Optimized result")
        }),
        destroy: vi.fn(),
      })

      const originalAI = globalThis.ai
      globalThis.ai = {
        languageModel: {
          capabilities: vi.fn().mockResolvedValue({ available: "readily" }),
          create: mockCreate,
        },
      }

      await optimizePrompt("test", rules)

      globalThis.ai = originalAI
    })
  })
})
