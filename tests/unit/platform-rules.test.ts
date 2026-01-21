import { describe, it, expect } from "vitest"

import {
  getRulesForPlatform,
  getFullRulesForPlatform,
  getRuleCount,
  getAllRules,
} from "~lib/platform-rules"

describe("platform-rules", () => {
  describe("getRulesForPlatform", () => {
    it("should return rules for openai platform", () => {
      const rules = getRulesForPlatform("openai")

      expect(rules.length).toBe(5)
      expect(rules[0]).toContain("instructions")
    })

    it("should return rules for anthropic platform", () => {
      const rules = getRulesForPlatform("anthropic")

      expect(rules.length).toBe(5)
      expect(rules[0]).toContain("XML")
    })

    it("should return rules for google platform", () => {
      const rules = getRulesForPlatform("google")

      expect(rules.length).toBe(5)
      expect(rules[0]).toContain("markdown")
    })

    it("should return openai rules as default for unknown platform", () => {
      const rules = getRulesForPlatform("unknown")
      const openaiRules = getRulesForPlatform("openai")

      expect(rules).toEqual(openaiRules)
    })

    it("should return string arrays", () => {
      const rules = getRulesForPlatform("openai")

      expect(Array.isArray(rules)).toBe(true)
      rules.forEach((rule) => {
        expect(typeof rule).toBe("string")
      })
    })
  })

  describe("getFullRulesForPlatform", () => {
    it("should return full rule objects for openai", () => {
      const rules = getFullRulesForPlatform("openai")

      expect(rules.length).toBe(5)
      expect(rules[0]).toHaveProperty("id")
      expect(rules[0]).toHaveProperty("platform", "openai")
      expect(rules[0]).toHaveProperty("rule")
      expect(rules[0]).toHaveProperty("title")
    })

    it("should return full rule objects for anthropic", () => {
      const rules = getFullRulesForPlatform("anthropic")

      expect(rules.length).toBe(5)
      rules.forEach((rule) => {
        expect(rule.platform).toBe("anthropic")
      })
    })

    it("should return full rule objects for google", () => {
      const rules = getFullRulesForPlatform("google")

      expect(rules.length).toBe(5)
      rules.forEach((rule) => {
        expect(rule.platform).toBe("google")
      })
    })

    it("should return openai rules for unknown platform", () => {
      const rules = getFullRulesForPlatform("unknown")
      const openaiRules = getFullRulesForPlatform("openai")

      expect(rules).toEqual(openaiRules)
    })

    it("should return copies of rules (not references)", () => {
      const rules1 = getFullRulesForPlatform("openai")
      const rules2 = getFullRulesForPlatform("openai")

      expect(rules1).not.toBe(rules2)
      expect(rules1).toEqual(rules2)
    })
  })

  describe("getRuleCount", () => {
    it("should return total count of all rules", () => {
      const count = getRuleCount()

      // 5 rules per platform (openai, anthropic, google) = 15 total
      expect(count).toBe(15)
    })
  })

  describe("getAllRules", () => {
    it("should return all rules from all platforms", () => {
      const allRules = getAllRules()

      expect(allRules.length).toBe(15)
    })

    it("should include rules from all platforms", () => {
      const allRules = getAllRules()

      const platforms = new Set(allRules.map((r) => r.platform))
      expect(platforms.has("openai")).toBe(true)
      expect(platforms.has("anthropic")).toBe(true)
      expect(platforms.has("google")).toBe(true)
    })

    it("should return copies of rules", () => {
      const rules1 = getAllRules()
      const rules2 = getAllRules()

      expect(rules1).not.toBe(rules2)
    })
  })

  describe("rule content quality", () => {
    it("should have meaningful rule text for each platform", () => {
      const platforms = ["openai", "anthropic", "google"] as const

      platforms.forEach((platform) => {
        const rules = getRulesForPlatform(platform)
        rules.forEach((rule) => {
          expect(rule.length).toBeGreaterThan(20) // Rules should be descriptive
        })
      })
    })

    it("should have unique rule IDs", () => {
      const allRules = getAllRules()
      const ids = allRules.map((r) => r.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})
