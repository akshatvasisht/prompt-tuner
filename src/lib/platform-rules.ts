import type { OptimizationRule, Platform, SupportedPlatform } from "~types";

import UNIVERSAL_BUNDLE from "../../rules/universal.json";
import OVERRIDE_BUNDLE from "../../rules/overrides.json";
import { fnv1a32 } from "~lib/hash";

// Universal rules apply to all platforms. Platform field is stamped at call time.
const UNIVERSAL = UNIVERSAL_BUNDLE as Omit<OptimizationRule, "platform">[];
// Override rules are platform-specific formatting hints.
const OVERRIDES = OVERRIDE_BUNDLE as OptimizationRule[];

function resolvedPlatform(platform: Platform): SupportedPlatform {
  return platform === "unknown" ? "openai" : platform;
}

/**
 * Gets all optimization rule strings for a platform.
 * Returns 4 universal rules + 1 platform-specific formatting override = 5 rules.
 */
export function getRulesForPlatform(platform: Platform): string[] {
  const p = resolvedPlatform(platform);
  const override = OVERRIDES.filter((r) => r.platform === p);
  return [...UNIVERSAL, ...override].map((r) => r.rule);
}

/**
 * Gets full optimization rule objects for a platform.
 * Universal rules are stamped with the requested platform.
 */
export function getFullRulesForPlatform(
  platform: Platform,
): OptimizationRule[] {
  const p = resolvedPlatform(platform);
  const stamped: OptimizationRule[] = UNIVERSAL.map((r) => ({
    ...r,
    platform: p,
  }));
  const override = OVERRIDES.filter((r) => r.platform === p);
  return [...stamped, ...override];
}

/**
 * Gets the total count of rules (4 universal + 3 overrides = 7).
 */
export function getRuleCount(): number {
  return UNIVERSAL.length + OVERRIDES.length;
}

/**
 * Deterministic fingerprint of the current rule set. Used as part of result
 * cache keys so bundled-rule changes invalidate cached optimizations on the
 * first load after an extension update.
 *
 * FNV-1a 32-bit over each rule's id+platform+rule fields - stable across runs,
 * no crypto dependency.
 */
let cachedRulesVersion: string | null = null;

export function getRulesVersion(): string {
  if (cachedRulesVersion !== null) return cachedRulesVersion;
  const parts: string[] = [];
  for (const r of UNIVERSAL) parts.push(r.id, r.rule);
  for (const r of OVERRIDES) parts.push(r.id, r.platform, r.rule);
  cachedRulesVersion = fnv1a32(parts.join("\x1f"));
  return cachedRulesVersion;
}

/**
 * Gets all rules. Universal rules are returned without a platform field.
 */
export function getAllRules(): OptimizationRule[] {
  return [...(UNIVERSAL as OptimizationRule[]), ...OVERRIDES];
}
