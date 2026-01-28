import { describe, it, expect, beforeEach, vi } from "vitest";
import { OptimizationRulesArraySchema, OptimizationRuleSchema } from "~types";

import {
  getRulesForPlatform,
  getFullRulesForPlatform,
  getRuleCount,
  getAllRules,
  initializeRules,
  refreshRules,
  updateRulesForPlatform,
} from "~lib/platform-rules";

// Mock chrome.storage for hybrid loading tests
declare global {
  // eslint-disable-next-line no-var
  var chrome: {
    storage: {
      local: {
        get: ReturnType<typeof vi.fn>;
        set: ReturnType<typeof vi.fn>;
        remove: ReturnType<typeof vi.fn>;
      };
    };
  };
  // eslint-disable-next-line no-var
  var fetch: ReturnType<typeof vi.fn>;
}

describe("platform-rules", () => {
  describe("getRulesForPlatform", () => {
    it("should return rules for openai platform", () => {
      const rules = getRulesForPlatform("openai");

      expect(rules.length).toBe(5);
      expect(rules[0]).toContain("instructions");
    });

    it("should return rules for anthropic platform", () => {
      const rules = getRulesForPlatform("anthropic");

      expect(rules.length).toBe(5);
      expect(rules[0]).toContain("XML");
    });

    it("should return rules for google platform", () => {
      const rules = getRulesForPlatform("google");

      expect(rules.length).toBe(5);
      expect(rules[0]).toContain("markdown");
    });

    it("should return openai rules as default for unknown platform", () => {
      const rules = getRulesForPlatform("unknown");
      const openaiRules = getRulesForPlatform("openai");

      expect(rules).toEqual(openaiRules);
    });

    it("should return string arrays", () => {
      const rules = getRulesForPlatform("openai");

      expect(Array.isArray(rules)).toBe(true);
      rules.forEach((rule) => {
        expect(typeof rule).toBe("string");
      });
    });
  });

  describe("getFullRulesForPlatform", () => {
    it("should return full rule objects for openai", () => {
      const rules = getFullRulesForPlatform("openai");

      expect(rules.length).toBe(5);
      expect(rules[0]).toHaveProperty("id");
      expect(rules[0]).toHaveProperty("platform", "openai");
      expect(rules[0]).toHaveProperty("rule");
      expect(rules[0]).toHaveProperty("title");
    });

    it("should return full rule objects for anthropic", () => {
      const rules = getFullRulesForPlatform("anthropic");

      expect(rules.length).toBe(5);
      rules.forEach((rule) => {
        expect(rule.platform).toBe("anthropic");
      });
    });

    it("should return full rule objects for google", () => {
      const rules = getFullRulesForPlatform("google");

      expect(rules.length).toBe(5);
      rules.forEach((rule) => {
        expect(rule.platform).toBe("google");
      });
    });

    it("should return openai rules for unknown platform", () => {
      const rules = getFullRulesForPlatform("unknown");
      const openaiRules = getFullRulesForPlatform("openai");

      expect(rules).toEqual(openaiRules);
    });

    it("should return copies of rules (not references)", () => {
      const rules1 = getFullRulesForPlatform("openai");
      const rules2 = getFullRulesForPlatform("openai");

      expect(rules1).not.toBe(rules2);
      expect(rules1).toEqual(rules2);
    });
  });

  describe("getRuleCount", () => {
    it("should return total count of all rules", () => {
      const count = getRuleCount();

      // 5 rules per platform (openai, anthropic, google) = 15 total
      expect(count).toBe(15);
    });
  });

  describe("getAllRules", () => {
    it("should return all rules from all platforms", () => {
      const allRules = getAllRules();

      expect(allRules.length).toBe(15);
    });

    it("should include rules from all platforms", () => {
      const allRules = getAllRules();

      const platforms = new Set(allRules.map((r) => r.platform));
      expect(platforms.has("openai")).toBe(true);
      expect(platforms.has("anthropic")).toBe(true);
      expect(platforms.has("google")).toBe(true);
    });

    it("should return copies of rules", () => {
      const rules1 = getAllRules();
      const rules2 = getAllRules();

      expect(rules1).not.toBe(rules2);
    });
  });

  describe("rule content quality", () => {
    it("should have meaningful rule text for each platform", () => {
      const platforms = ["openai", "anthropic", "google"] as const;

      platforms.forEach((platform) => {
        const rules = getRulesForPlatform(platform);
        rules.forEach((rule) => {
          expect(rule.length).toBeGreaterThan(20); // Rules should be descriptive
        });
      });
    });

    it("should have unique rule IDs", () => {
      const allRules = getAllRules();
      const ids = allRules.map((r) => r.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Phase 3: Zod Validation", () => {
    it("should validate correct rule structure", () => {
      const validRule = {
        id: "test-1",
        platform: "openai" as const,
        title: "Test Rule",
        description: "A test rule",
        rule: "This is a valid rule that is long enough",
        tags: ["test"],
        source: "https://example.com",
        createdAt: "2024-01-01T00:00:00Z",
      };

      const result = OptimizationRuleSchema.safeParse(validRule);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("test-1");
        expect(result.data.platform).toBe("openai");
      }
    });

    it("should reject invalid rule structure", () => {
      const invalidRule = {
        id: "", // Empty ID should fail
        platform: "openai",
        rule: "short", // Too short
      };

      const result = OptimizationRuleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });

    it("should validate array of rules", () => {
      const validRules = [
        {
          id: "test-1",
          platform: "openai" as const,
          rule: "This is a valid rule that is long enough",
        },
        {
          id: "test-2",
          platform: "anthropic" as const,
          rule: "This is another valid rule that is long enough",
        },
      ];

      const result = OptimizationRulesArraySchema.safeParse(validRules);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
      }
    });

    it("should reject invalid platform enum", () => {
      const invalidRule = {
        id: "test-1",
        platform: "invalid-platform", // Invalid enum value
        rule: "This is a valid rule that is long enough",
      };

      const result = OptimizationRuleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });

    it("should accept optional fields", () => {
      const minimalRule = {
        id: "test-1",
        platform: "openai" as const,
        rule: "This is a valid rule that is long enough",
      };

      const result = OptimizationRuleSchema.safeParse(minimalRule);
      expect(result.success).toBe(true);
    });
  });

  describe("Phase 3: Hybrid Loading & Caching", () => {
    beforeEach(() => {
      // Reset chrome.storage mocks
      vi.clearAllMocks();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = vi.fn();
    });

    it("should use bundled rules when fetch fails", async () => {
      // Mock fetch to fail
      global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

      // Mock chrome.storage to return no cache
      vi.mocked(chrome.storage.local.get).mockResolvedValue({});

      await updateRulesForPlatform("openai");

      const rules = getRulesForPlatform("openai");
      expect(rules.length).toBeGreaterThan(0);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should use cached rules when available and not expired", async () => {
      const cachedRules = [
        {
          id: "cached-1",
          platform: "openai" as const,
          rule: "This is a cached rule that is long enough",
          title: "Cached Rule",
        },
      ];

      const cacheKey = "rules_cache_openai";
      const cachedData = {
        rules: cachedRules,
        fetchedAt: Date.now() - 1000, // 1 second ago (not expired)
        source: "remote" as const,
      };

      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [cacheKey]: cachedData,
      });

      await updateRulesForPlatform("openai");

      // Should not call fetch when cache is valid
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should fetch remote rules when cache is expired", async () => {
      const validRemoteRules = [
        {
          id: "remote-1",
          platform: "openai" as const,
          rule: "This is a remote rule that is long enough",
          title: "Remote Rule",
        },
      ];

      const expiredCache = {
        rules: [],
        fetchedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago (expired)
        source: "remote" as const,
      };

      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        rules_cache_openai: expiredCache,
      });

      // Mock successful fetch with valid rules
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(validRemoteRules),
        } as Response),
      );

      await updateRulesForPlatform("openai");

      expect(global.fetch).toHaveBeenCalled();
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it("should fallback to bundled rules when remote validation fails", async () => {
      const invalidRemoteRules = {
        id: "invalid", // Missing required fields
        platform: "openai",
      };

      vi.mocked(chrome.storage.local.get).mockResolvedValue({});

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([invalidRemoteRules]),
        } as Response),
      );

      await updateRulesForPlatform("openai");

      // Should fallback to bundled rules
      const rules = getRulesForPlatform("openai");
      expect(rules.length).toBeGreaterThan(0);
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it("should initialize rules for all platforms", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({});
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
        } as Response),
      );

      await initializeRules();

      // Should have attempted to fetch for all platforms
      expect(global.fetch).toHaveBeenCalledTimes(3); // openai, anthropic, google
    });

    it("should refresh rules by clearing cache", async () => {
      const cacheKey = "rules_cache_openai";
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [cacheKey]: {
          rules: [],
          fetchedAt: Date.now(),
          source: "remote" as const,
        },
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response),
      );

      await refreshRules();

      // Should have cleared cache
      expect(chrome.storage.local.remove).toHaveBeenCalled();
      // Should have re-fetched
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
