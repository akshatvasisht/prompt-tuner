import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  checkAIAvailability,
  optimizePrompt,
  optimizeWithRefineChain,
  optimizeWithWriter,
  optimizeWithRewriter,
  optimizeWithDecomposition,
  clearSessionCache,
} from "~lib/ai-engine";
import { PromptTunerError } from "~types";

import { createMockLanguageModel, resetLanguageModelMock } from "../setup";

describe("ai-engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLanguageModelMock();
    clearSessionCache();
  });

  afterEach(() => {
    resetLanguageModelMock();
  });

  describe("checkAIAvailability", () => {
    it("should return available when AI is ready", async () => {
      const result = await checkAIAvailability();
      expect(result.available).toBe(true);
    });

    it("should return unavailable when LanguageModel is not defined", async () => {
      // @ts-expect-error - intentionally setting to undefined for test
      globalThis.LanguageModel = undefined;

      const result = await checkAIAvailability();
      expect(result.available).toBe(false);
      expect(result.reason).toContain("LanguageModel API not available");
    });

    it("should return needsDownload when model is downloadable", async () => {
      vi.stubGlobal(
        "LanguageModel",
        createMockLanguageModel({ availability: "downloadable" }),
      );

      const result = await checkAIAvailability();
      expect(result.available).toBe(false);
      expect(result.needsDownload).toBe(true);
      expect(result.reason).toContain("downloaded");
    });

    it("should return needsDownload when model is downloading", async () => {
      vi.stubGlobal(
        "LanguageModel",
        createMockLanguageModel({ availability: "downloading" }),
      );

      const result = await checkAIAvailability();
      expect(result.available).toBe(false);
      expect(result.needsDownload).toBe(true);
      expect(result.reason).toContain("downloading");
    });

    it("should return unavailable when model is unavailable", async () => {
      vi.stubGlobal(
        "LanguageModel",
        createMockLanguageModel({ availability: "unavailable" }),
      );

      const result = await checkAIAvailability();
      expect(result.available).toBe(false);
      expect(result.reason).toContain("not supported");
    });

    it("should handle errors gracefully", async () => {
      vi.stubGlobal("LanguageModel", {
        availability: vi.fn().mockRejectedValue(new Error("API error")),
        create: vi.fn(),
        capabilities: vi.fn(),
      });

      const result = await checkAIAvailability();
      expect(result.available).toBe(false);
      expect(result.reason).toContain("API error");
    });
  });

  describe("optimizePrompt", () => {
    it("should return optimized prompt when AI is available", async () => {
      const draft = "test prompt";
      const rules = ["rule 1", "rule 2"];

      const result = await optimizePrompt(draft, rules);

      expect(result).toContain("Optimized");
      expect(result).toContain(draft);
    });

    it("should throw PromptTunerError when AI is unavailable", async () => {
      // @ts-expect-error - intentionally setting to undefined for test
      globalThis.LanguageModel = undefined;

      await expect(optimizePrompt("test", ["rule"])).rejects.toThrow(
        PromptTunerError,
      );
    });

    it("should use default rules when empty array provided", async () => {
      const result = await optimizePrompt("test prompt", []);

      expect(result).toBeTruthy();
    });

    it("should call destroy on session when cache is cleared", async () => {
      const mockDestroy = vi.fn();
      const mockSession = {
        prompt: vi.fn().mockResolvedValue("Optimized result"),
        promptStreaming: vi.fn(),
        destroy: mockDestroy,
      };

      vi.stubGlobal("LanguageModel", {
        availability: vi.fn().mockResolvedValue("available"),
        capabilities: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue(mockSession),
      });

      await optimizePrompt("test", ["rule"]);
      clearSessionCache();

      expect(mockDestroy).toHaveBeenCalled();
    });

    it("should return original prompt if AI returns empty string", async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue("   "),
        promptStreaming: vi.fn(),
        destroy: vi.fn(),
      };

      vi.stubGlobal("LanguageModel", {
        availability: vi.fn().mockResolvedValue("available"),
        capabilities: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue(mockSession),
      });

      const originalPrompt = "my original prompt";
      const result = await optimizePrompt(originalPrompt, ["rule"]);

      expect(result).toBe(originalPrompt);
    });

    it("should throw PromptTunerError when session creation fails", async () => {
      vi.stubGlobal("LanguageModel", {
        availability: vi.fn().mockResolvedValue("available"),
        capabilities: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockRejectedValue(new Error("Session failed")),
      });

      await expect(optimizePrompt("test", ["rule"])).rejects.toThrow(
        PromptTunerError,
      );
    });
  });

  describe("optimizeWithRefineChain", () => {
    it("runs two turns: non-streaming critique, then streaming polish", async () => {
      const critiqueResult = "1. Be clearer\n2. Add structure";
      const polishChunks = ["Polished: ", "final prompt"];
      let promptCallCount = 0;

      const promptFn = vi.fn((_input: string) => {
        promptCallCount++;
        return Promise.resolve(critiqueResult);
      });
      const promptStreamingFn = vi.fn(() => {
        let i = 0;
        return new ReadableStream<string>({
          pull(controller) {
            if (i < polishChunks.length) {
              controller.enqueue(polishChunks[i] ?? "");
              i++;
            } else {
              controller.close();
            }
          },
        });
      });

      const session = {
        prompt: promptFn,
        promptStreaming: promptStreamingFn,
        append: vi.fn().mockResolvedValue(undefined),
        clone: vi.fn(),
        destroy: vi.fn(),
        measureInputUsage: vi.fn().mockResolvedValue(50),
        inputQuota: 4096,
      };
      // Session clones itself
      session.clone.mockResolvedValue(session);

      vi.stubGlobal("LanguageModel", {
        availability: vi.fn().mockResolvedValue("available"),
        create: vi.fn().mockResolvedValue(session),
      });

      const chunks: string[] = [];
      const result = await optimizeWithRefineChain(
        "draft prompt",
        ["rule 1"],
        (c) => chunks.push(c),
      );

      expect(promptCallCount).toBe(1); // critique turn
      expect(promptStreamingFn).toHaveBeenCalledTimes(1); // polish turn
      expect(chunks.join("")).toContain("Polished");
      expect(result).toContain("Polished");
    });

    it("reports stage labels via onStage callback", async () => {
      const stages: string[] = [];
      await optimizeWithRefineChain(
        "draft",
        [],
        () => {
          /* noop */
        },
        { onStage: (s) => stages.push(s) },
      );
      expect(stages).toContain("critiquing");
      expect(stages).toContain("polishing");
    });
  });

  describe("optimizeWithWriter", () => {
    it("uses the Writer API when available", async () => {
      const chunks: string[] = [];
      const result = await optimizeWithWriter("draft", ["rule"], (c) =>
        chunks.push(c),
      );
      expect(result).toContain("Written");
    });

    it("falls back to prompt engine when Writer unavailable", async () => {
      const originalWriter = (globalThis as unknown as { Writer?: unknown })
        .Writer;
      // @ts-expect-error intentional
      globalThis.Writer = undefined;
      try {
        const chunks: string[] = [];
        const result = await optimizeWithWriter("draft", [], (c) =>
          chunks.push(c),
        );
        expect(result).toContain("Optimized");
      } finally {
        (globalThis as unknown as { Writer?: unknown }).Writer = originalWriter;
      }
    });
  });

  describe("optimizeWithRewriter", () => {
    it("uses the Rewriter API when available", async () => {
      const chunks: string[] = [];
      const result = await optimizeWithRewriter("draft", ["rule"], (c) =>
        chunks.push(c),
      );
      expect(result).toContain("Rewritten");
    });
  });

  describe("optimizeWithDecomposition", () => {
    it("produces a composed tree output and streams lines", async () => {
      const session = {
        prompt: vi
          .fn()
          .mockResolvedValueOnce(JSON.stringify(["Phase A", "Phase B"]))
          .mockResolvedValue(JSON.stringify(["Step 1", "Step 2"])),
        promptStreaming: vi.fn(),
        append: vi.fn().mockResolvedValue(undefined),
        clone: vi.fn(),
        destroy: vi.fn(),
        measureInputUsage: vi.fn().mockResolvedValue(50),
        inputQuota: 4096,
      };
      session.clone.mockResolvedValue(session);

      vi.stubGlobal("LanguageModel", {
        availability: vi.fn().mockResolvedValue("available"),
        create: vi.fn().mockResolvedValue(session),
      });

      const chunks: string[] = [];
      const result = await optimizeWithDecomposition("my task", [], (c) =>
        chunks.push(c),
      );

      expect(result).toContain("Phase A");
      expect(result).toContain("Phase B");
      expect(result).toContain("Step 1");
      expect(chunks.length).toBeGreaterThan(0);
    });
  });
});
