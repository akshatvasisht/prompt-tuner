import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { checkAIAvailability, optimizePrompt } from "~lib/ai-engine";
import { PromptTunerError } from "~types";

import { createMockLanguageModel, resetLanguageModelMock } from "../setup";

describe("ai-engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLanguageModelMock();
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

    it("should call destroy on session after completion", async () => {
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
});
