/**
 * Platform Rules - Hybrid Loading Strategy
 *
 * Architecture:
 * 1. Bundled Rules: Import JSON files as fallback (offline capability)
 * 2. Remote Rules: Fetch from GitHub Pages on startup (quarterly updates)
 * 3. Validation: Zod schemas validate all fetched rules
 * 4. Caching: Store in chrome.storage.local to avoid excessive fetches
 * 5. Fallback: Always revert to bundled rules on failure
 *
 * Benefits:
 * - Offline capability (bundled rules)
 * - Dynamic updates without Chrome Web Store review
 * - Security (Zod validation)
 * - Performance (7-day cache)
 *
 * =============================================================================
 * SECURITY ARCHITECTURE
 * =============================================================================
 *
 * This file implements defense-in-depth against Remote Code Execution (RCE):
 *
 * Layer 1: Content Security Policy (CSP)
 * - Restricts fetch() to *.github.io and *.githubusercontent.com only
 * - Configured in package.json manifest.content_security_policy
 * - Browser-enforced, cannot be bypassed by compromised code
 *
 * Layer 2: Zod Schema Validation
 * - All fetched JSON validated with OptimizationRulesArraySchema
 * - Type safety enforced at runtime
 * - Malformed data rejected before use
 *
 * Layer 3: Data-Only Treatment
 * - Rules are text strings, never evaluated as code
 * - No eval(), new Function(), or dynamic execution
 * - Rules rendered via React (auto-escaped for XSS protection)
 *
 * Layer 4: Fail-Safe Fallback
 * - Any validation failure → bundled rules used instead
 * - Network errors → bundled rules used
 * - Extension always functional, even under attack
 *
 * Layer 5: Immutable Bundled Rules
 * - Bundled at build time from rules/*.json
 * - Cannot be modified post-deployment
 * - Guaranteed safe fallback exists
 *
 * Attack Scenarios Mitigated:
 * ✅ Compromised GitHub Pages → Zod validation rejects → bundled fallback
 * ✅ Man-in-the-middle (MITM) → HTTPS + CSP → prevented
 * ✅ Prototype pollution → Zod creates new objects → safe
 * ✅ XSS via rules → React auto-escaping → sanitized
 * ✅ Remote code injection → No eval() anywhere → impossible
 *
 * Compliance:
 * - Chrome Web Store Remote Code Policy: ✅ PASS (rules are data)
 * - Chrome Web Store User Data Privacy: ✅ PASS (no user data in rules)
 *
 * Audit Status: ✅ Security audit passed (see docs/SECURITY_AUDIT.md)
 * =============================================================================
 */

import {
  type OptimizationRule,
  type Platform,
  type SupportedPlatform,
  OptimizationRulesArraySchema,
  type CachedRules,
} from "~types";
import { clearSessionCache } from "~lib/ai-engine";

import { logger } from "~lib/logger";
import { STORAGE_KEYS, CONFIG } from "~lib/constants";

// =============================================================================
// Bundled Rules (Fallback)
// =============================================================================

/**
 * Convert hardcoded rules to match OptimizationRule interface
 */
import OPENAI_BUNDLE from "../../rules/openai.json";
import ANTHROPIC_BUNDLE from "../../rules/anthropic.json";
import GOOGLE_BUNDLE from "../../rules/google.json";

// Bundled rules as fallback
const BUNDLED_RULES: Record<SupportedPlatform, OptimizationRule[]> = {
  openai: OPENAI_BUNDLE as OptimizationRule[],
  anthropic: ANTHROPIC_BUNDLE as OptimizationRule[],
  google: GOOGLE_BUNDLE as OptimizationRule[],
};

// Runtime rules (may be updated from remote)
const RUNTIME_RULES: Record<SupportedPlatform, OptimizationRule[]> = {
  ...BUNDLED_RULES,
};

// =============================================================================
// Rule Fetching & Validation
// =============================================================================

/**
 * Fetches rules for a platform from GitHub Pages
 * Returns null on failure (network error, validation error, etc.)
 *
 * SECURITY: This function is designed to prevent Remote Code Execution (RCE)
 *
 * Defense-in-Depth Strategy:
 * 1. Content Security Policy (CSP) restricts fetch origins to *.github.io and *.githubusercontent.com
 * 2. Zod schema validation ensures fetched data matches expected structure
 * 3. Rules are treated as data (text strings), never executed as code
 * 4. Validation failure triggers fallback to bundled rules
 * 5. No eval(), new Function(), or dynamic code execution anywhere
 *
 * Attack Vector Analysis:
 * - Compromised GitHub Pages → Zod validation rejects malformed data → bundled fallback
 * - Malicious JSON injection → Schema validation prevents prototype pollution
 * - XSS via rules → Rules are text-only, rendered safely via React (auto-escaped)
 *
 * Compliance: Meets Chrome Web Store Remote Code Policy (rules are data, not code)
 */
async function fetchRemoteRules(
  platform: SupportedPlatform,
): Promise<OptimizationRule[] | null> {
  try {
    const url = `${CONFIG.GITHUB_PAGES_BASE_URL}/rules/${platform}.json`;

    // SECURITY: CSP restricts this fetch to whitelisted origins only
    // Only *.github.io and *.githubusercontent.com are allowed
    const response = await fetch(url, {
      cache: "no-cache",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      logger.warn(
        `Failed to fetch remote rules for ${platform}: ${String(response.status)}`,
      );
      return null; // Triggers bundled fallback
    }

    // SECURITY: response.json() parses JSON as DATA, not code
    // No dynamic evaluation - safe JSON parsing only
    const jsonData = (await response.json()) as unknown;

    // SECURITY: Zod schema validation is the critical defense layer
    // Validates structure, types, and constraints before use
    // Prevents: malformed data, prototype pollution, type confusion
    const validationResult = OptimizationRulesArraySchema.safeParse(jsonData);

    if (!validationResult.success) {
      logger.error(
        `Validation failed for ${platform}:`,
        validationResult.error,
      );
      // SECURITY: Validation failure = potential attack → reject and use bundled fallback
      return null;
    }

    logger.info(
      `Successfully fetched and validated ${String(validationResult.data.length)} rules for ${platform}`,
    );

    // SECURITY: validationResult.data is type-safe and structurally validated
    // Rules contain only text strings (never executable code)
    return validationResult.data as OptimizationRule[];
  } catch (error) {
    logger.error(
      `Error fetching remote rules for ${platform}:`,
      error,
    );
    // SECURITY: Any error (network, parse, etc.) → safe fallback to bundled rules
    return null;
  }
}

/**
 * Gets cached rules from chrome.storage.local
 */
async function getCachedRules(
  platform: SupportedPlatform,
): Promise<CachedRules | null> {
  try {
    const key = `${STORAGE_KEYS.RULES_CACHE_PREFIX}${platform}`;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const result = await chrome.storage.local.get(key);

    if (!result[key]) {
      return null;
    }

    const cached = result[key] as CachedRules;

    // Check if cache is expired
    if (Date.now() - cached.fetchedAt > CONFIG.CACHE_DURATION_MS) {
      return null;
    }

    return cached;
  } catch (error) {
    logger.error(
      `Error reading cache for ${platform}:`,
      error,
    );
    return null;
  }
}

/**
 * Saves rules to chrome.storage.local
 */
async function cacheRules(
  platform: SupportedPlatform,
  rules: OptimizationRule[],
  source: "bundled" | "remote",
): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.RULES_CACHE_PREFIX}${platform}`;
    const cached: CachedRules = {
      rules,
      fetchedAt: Date.now(),
      source,
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await chrome.storage.local.set({ [key]: cached });
  } catch (error) {
    logger.error(
      `Error caching rules for ${platform}:`,
      error,
    );
  }
}

/**
 * Updates rules for a platform (tries remote, falls back to bundled)
 *
 * SECURITY: Hybrid loading architecture ensures fail-safe operation
 *
 * Loading Strategy:
 * 1. Check cache (valid for 7 days)
 * 2. Attempt remote fetch from GitHub Pages
 * 3. Validate fetched data with Zod schema
 * 4. Fallback to bundled rules on ANY failure
 *
 * Security Guarantees:
 * - Never uses unvalidated external data
 * - Always has working rules (bundled fallback)
 * - No service disruption from network issues or attacks
 * - CSP prevents fetching from unauthorized origins
 */
export async function updateRulesForPlatform(
  platform: SupportedPlatform,
): Promise<void> {
  // Try to get cached rules first (avoids unnecessary network requests)
  const cached = await getCachedRules(platform);
  if (cached) {
    // SECURITY: Cached rules were previously validated, safe to use
    RUNTIME_RULES[platform] = cached.rules;
    logger.info(
      `Using cached rules for ${platform} (source: ${cached.source})`,
    );
    return;
  }

  // Try to fetch remote rules (may fail due to network, validation, or CSP)
  const remoteRules = await fetchRemoteRules(platform);

  if (remoteRules) {
    // Success: remote rules passed Zod validation
    // SECURITY: remoteRules is type-safe and structurally validated
    RUNTIME_RULES[platform] = remoteRules;
    await cacheRules(platform, remoteRules, "remote");
    clearSessionCache(); // Invalidate AI session cache when rules change
    logger.info(`Updated to remote rules for ${platform}`);
  } else {
    // Failure: network error, validation error, or CSP blocked fetch
    // SECURITY: Fallback to bundled rules (bundled at build time, trusted)
    RUNTIME_RULES[platform] = BUNDLED_RULES[platform];
    await cacheRules(platform, BUNDLED_RULES[platform], "bundled");
    logger.info(
      `Falling back to bundled rules for ${platform}`,
    );
  }
}

/**
 * Initializes rules for all platforms on extension startup
 */
export async function initializeRules(): Promise<void> {
  const platforms: SupportedPlatform[] = ["openai", "anthropic", "google"];
  await Promise.all(platforms.map(updateRulesForPlatform));
}

/**
 * Forces a refresh of rules from remote source
 */
export async function refreshRules(): Promise<void> {
  // Clear cache
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  await chrome.storage.local.remove([
    `${STORAGE_KEYS.RULES_CACHE_PREFIX}openai`,
    `${STORAGE_KEYS.RULES_CACHE_PREFIX}anthropic`,
    `${STORAGE_KEYS.RULES_CACHE_PREFIX}google`,
  ]);

  // Re-fetch
  await initializeRules();
}

// =============================================================================
// Public API (unchanged interface for backward compatibility)
// =============================================================================

/**
 * Gets all optimization rules for a platform
 *
 * @param platform - The LLM platform to get rules for
 * @returns Array of rule strings for the platform
 */
export function getRulesForPlatform(platform: Platform): string[] {
  if (platform === "unknown") {
    // Default to OpenAI rules for unknown platforms
    return RUNTIME_RULES.openai.map((r) => r.rule);
  }
  return RUNTIME_RULES[platform].map((r) => r.rule);
}

/**
 * Gets full optimization rule objects for a platform
 *
 * @param platform - The LLM platform to get rules for
 * @returns Array of OptimizationRule objects
 */
export function getFullRulesForPlatform(
  platform: Platform,
): OptimizationRule[] {
  if (platform === "unknown") {
    return [...RUNTIME_RULES.openai];
  }
  return [...RUNTIME_RULES[platform]];
}

/**
 * Gets the total count of rules across all platforms
 */
export function getRuleCount(): number {
  return (
    RUNTIME_RULES.openai.length +
    RUNTIME_RULES.anthropic.length +
    RUNTIME_RULES.google.length
  );
}

/**
 * Gets all rules across all platforms
 */
export function getAllRules(): OptimizationRule[] {
  return [
    ...RUNTIME_RULES.openai,
    ...RUNTIME_RULES.anthropic,
    ...RUNTIME_RULES.google,
  ];
}
