import { describe, it, expect } from "vitest";

import {
  getRulesForPlatform,
  getFullRulesForPlatform,
  getRuleCount,
  getAllRules,
} from "~lib/platform-rules";

describe("platform-rules", () => {
  describe("getRulesForPlatform", () => {
    it("should return 5 rules for openai (4 universal + 1 override)", () => {
      const rules = getRulesForPlatform("openai");
      expect(rules.length).toBe(5);
    });

    it("should return 5 rules for anthropic (4 universal + 1 override)", () => {
      const rules = getRulesForPlatform("anthropic");
      expect(rules.length).toBe(5);
    });

    it("should return 5 rules for google (4 universal + 1 override)", () => {
      const rules = getRulesForPlatform("google");
      expect(rules.length).toBe(5);
    });

    it("should include anthropic-specific XML guidance for anthropic", () => {
      const rules = getRulesForPlatform("anthropic");
      const hasXml = rules.some((r) => r.toLowerCase().includes("xml"));
      expect(hasXml).toBe(true);
    });

    it("should include google-specific markdown guidance for google", () => {
      const rules = getRulesForPlatform("google");
      const hasMarkdown = rules.some((r) => r.toLowerCase().includes("markdown"));
      expect(hasMarkdown).toBe(true);
    });

    it("should include openai-specific framing guidance for openai", () => {
      const rules = getRulesForPlatform("openai");
      const hasPositive = rules.some((r) => r.toLowerCase().includes("positive"));
      expect(hasPositive).toBe(true);
    });

    it("should return same rules for unknown platform as openai", () => {
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
    it("should return 5 rule objects for openai", () => {
      const rules = getFullRulesForPlatform("openai");
      expect(rules.length).toBe(5);
    });

    it("should stamp universal rules with the requested platform", () => {
      const rules = getFullRulesForPlatform("openai");
      expect(rules[0]).toHaveProperty("id");
      expect(rules[0]).toHaveProperty("platform", "openai");
      expect(rules[0]).toHaveProperty("rule");
    });

    it("should stamp all returned rules with anthropic platform", () => {
      const rules = getFullRulesForPlatform("anthropic");
      expect(rules.length).toBe(5);
      rules.forEach((rule) => {
        expect(rule.platform).toBe("anthropic");
      });
    });

    it("should stamp all returned rules with google platform", () => {
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
    it("should return total count of all rules (4 universal + 3 overrides = 7)", () => {
      const count = getRuleCount();
      expect(count).toBe(7);
    });
  });

  describe("getAllRules", () => {
    it("should return all 7 rules (4 universal + 3 overrides)", () => {
      const allRules = getAllRules();
      expect(allRules.length).toBe(7);
    });

    it("should include platform-specific override rules for all three platforms", () => {
      const allRules = getAllRules();
      const platforms = new Set(allRules.map((r) => r.platform).filter(Boolean));
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
          expect(rule.length).toBeGreaterThan(20);
        });
      });
    });

    it("should have unique rule IDs across all rules", () => {
      const allRules = getAllRules();
      const ids = allRules.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("universal rules should cover key prompt engineering tags", () => {
      const allRules = getAllRules();
      const allTags = allRules.flatMap((r) => r.tags ?? []);
      const tagSet = new Set(allTags);

      // Core technique tags that actionToTags depends on
      expect(tagSet.has("structure")).toBe(true);
      expect(tagSet.has("examples")).toBe(true);
      expect(tagSet.has("few-shot")).toBe(true);
      expect(tagSet.has("reasoning")).toBe(true);
      expect(tagSet.has("chain-of-thought")).toBe(true);
      expect(tagSet.has("steps")).toBe(true);
      expect(tagSet.has("format")).toBe(true);
      expect(tagSet.has("constraints")).toBe(true);
      expect(tagSet.has("persona")).toBe(true);
      expect(tagSet.has("role")).toBe(true);
      expect(tagSet.has("decomposition")).toBe(true);
    });
  });
});
