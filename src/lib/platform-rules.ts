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
 */

import openaiRulesJson from "../../rules/openai.json"
import anthropicRulesJson from "../../rules/anthropic.json"
import googleRulesJson from "../../rules/google.json"

import { 
  type OptimizationRule, 
  type Platform, 
  type SupportedPlatform,
  OptimizationRulesArraySchema,
  type CachedRules 
} from "~types"
import { clearSessionCache } from "~lib/ai-engine"

// =============================================================================
// Constants
// =============================================================================

/**
 * GitHub Pages base URL for fetching remote rules
 * 
 * IMPORTANT: Replace with your actual GitHub Pages URL after deployment
 * Format: https://{username}.github.io/{repo-name}
 * 
 * Example: https://myusername.github.io/prompt-tuner
 * 
 * If not configured, the extension will use bundled rules as fallback
 */
const GITHUB_PAGES_BASE_URL = "https://YOUR_ORG.github.io/prompt-tuner"
const CACHE_KEY_PREFIX = "rules_cache_"
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// =============================================================================
// Bundled Rules (Fallback)
// =============================================================================

/**
 * Convert hardcoded rules to match OptimizationRule interface
 */
const OPENAI_RULES: OptimizationRule[] = [
  {
    id: "openai-1",
    platform: "openai",
    title: "Clear Instructions with Delimiters",
    rule: "Use clear, specific instructions with delimiters like triple quotes, XML tags, or markdown headers to separate different parts of the input.",
    description: "Structure your prompts with distinct sections for better comprehension",
    tags: ["structure", "clarity", "formatting"],
  },
  {
    id: "openai-2",
    platform: "openai",
    title: "Few-Shot Examples",
    rule: "Provide 2-3 examples of desired input-output pairs before your actual request. This demonstrates the expected format and behavior.",
    description: "Demonstrate expected behavior through concrete examples",
    tags: ["examples", "few-shot", "demonstration"],
  },
  {
    id: "openai-3",
    platform: "openai",
    title: "Role Assignment",
    rule: "Start with a role or persona: 'You are an expert [role] with deep knowledge in [domain].' This sets context and expertise level.",
    description: "Give the model a specific identity to improve response quality",
    tags: ["persona", "role", "context"],
  },
  {
    id: "openai-4",
    platform: "openai",
    title: "Step-by-Step Breakdown",
    rule: "For complex tasks, instruct the model to 'think step by step' or break down its reasoning before providing the final answer.",
    description: "Enable systematic problem-solving for complex queries",
    tags: ["reasoning", "steps", "chain-of-thought"],
  },
  {
    id: "openai-5",
    platform: "openai",
    title: "Output Format Specification",
    rule: "Explicitly specify the desired output format: JSON, markdown, bullet points, table, etc. Include an example of the exact structure.",
    description: "Define clear output expectations for consistent results",
    tags: ["format", "output", "structure"],
  },
]

const ANTHROPIC_RULES: OptimizationRule[] = [
  {
    id: "anthropic-1",
    platform: "anthropic",
    title: "XML Tag Structure",
    rule: "Use XML tags like <context>, <task>, <instructions>, and <output> to structure prompts. Claude responds exceptionally well to XML-structured input.",
    description: "Leverage Claude's preference for XML-structured prompts",
    tags: ["structure", "xml", "formatting"],
  },
  {
    id: "anthropic-2",
    platform: "anthropic",
    title: "Chain of Thought with Tags",
    rule: "Request reasoning with <thinking> tags: 'Before answering, show your reasoning in <thinking> tags, then provide your final answer.'",
    description: "Enable step-by-step reasoning for complex problems",
    tags: ["reasoning", "thinking", "chain-of-thought"],
  },
  {
    id: "anthropic-3",
    platform: "anthropic",
    title: "Explicit Constraints",
    rule: "List constraints explicitly: 'You MUST: [list]. You MUST NOT: [list].' Claude follows explicit boundaries well.",
    description: "Set clear boundaries and requirements",
    tags: ["constraints", "boundaries", "explicit"],
  },
  {
    id: "anthropic-4",
    platform: "anthropic",
    title: "Document in Context",
    rule: "When providing documents, wrap them in <document> tags and reference them explicitly: 'Based on the document above...'",
    description: "Properly structure document-based queries",
    tags: ["documents", "context", "reference"],
  },
  {
    id: "anthropic-5",
    platform: "anthropic",
    title: "Multi-Turn Context",
    rule: "For multi-step tasks, use <previous_response> to reference earlier outputs and build on them systematically.",
    description: "Maintain context across complex interactions",
    tags: ["multi-turn", "context", "continuity"],
  },
]

const GOOGLE_RULES: OptimizationRule[] = [
  {
    id: "google-1",
    platform: "google",
    title: "Markdown Formatting",
    rule: "Use markdown formatting (headers, lists, bold) for structure. Gemini parses and responds well to markdown-formatted prompts.",
    description: "Structure prompts using markdown for better parsing",
    tags: ["structure", "markdown", "formatting"],
  },
  {
    id: "google-2",
    platform: "google",
    title: "Concrete Examples",
    rule: "Include concrete, specific examples with real details. Gemini performs better with grounded scenarios rather than abstract requests.",
    description: "Ground your prompts in specific, real-world examples",
    tags: ["examples", "specificity", "grounding"],
  },
  {
    id: "google-3",
    platform: "google",
    title: "Explicit Requirements",
    rule: "List requirements as a numbered checklist: '1. Must include X, 2. Should avoid Y, 3. Format as Z.' Be explicit about all constraints.",
    description: "Clearly state all requirements and constraints",
    tags: ["requirements", "constraints", "explicit"],
  },
  {
    id: "google-4",
    platform: "google",
    title: "Context Window Optimization",
    rule: "Place the most important context and instructions at the beginning and end of long prompts. Middle content may receive less attention.",
    description: "Optimize prompt structure for attention patterns",
    tags: ["context", "attention", "optimization"],
  },
  {
    id: "google-5",
    platform: "google",
    title: "Task Decomposition",
    rule: "Break complex requests into subtasks: 'First, analyze X. Then, based on that analysis, do Y. Finally, synthesize into Z.'",
    description: "Structure complex tasks as sequential steps",
    tags: ["decomposition", "steps", "complex"],
  },
]

// Bundled rules as fallback
const BUNDLED_RULES: Record<SupportedPlatform, OptimizationRule[]> = {
  openai: OPENAI_RULES,
  anthropic: ANTHROPIC_RULES,
  google: GOOGLE_RULES,
}

// Runtime rules (may be updated from remote)
let RUNTIME_RULES: Record<SupportedPlatform, OptimizationRule[]> = { ...BUNDLED_RULES }

// =============================================================================
// Rule Fetching & Validation
// =============================================================================

/**
 * Fetches rules for a platform from GitHub Pages
 * Returns null on failure (network error, validation error, etc.)
 */
async function fetchRemoteRules(platform: SupportedPlatform): Promise<OptimizationRule[] | null> {
  try {
    const url = `${GITHUB_PAGES_BASE_URL}/rules/${platform}.json`
    const response = await fetch(url, {
      cache: "no-cache",
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      console.warn(`[PlatformRules] Failed to fetch remote rules for ${platform}: ${response.status}`)
      return null
    }

    const jsonData = await response.json()

    // Validate with Zod schema
    const validationResult = OptimizationRulesArraySchema.safeParse(jsonData)

    if (!validationResult.success) {
      console.error(`[PlatformRules] Validation failed for ${platform}:`, validationResult.error)
      return null
    }

    console.log(`[PlatformRules] Successfully fetched and validated ${validationResult.data.length} rules for ${platform}`)
    return validationResult.data as OptimizationRule[]
  } catch (error) {
    console.error(`[PlatformRules] Error fetching remote rules for ${platform}:`, error)
    return null
  }
}

/**
 * Gets cached rules from chrome.storage.local
 */
async function getCachedRules(platform: SupportedPlatform): Promise<CachedRules | null> {
  try {
    const key = `${CACHE_KEY_PREFIX}${platform}`
    const result = await chrome.storage.local.get(key)
    
    if (!result[key]) {
      return null
    }

    const cached = result[key] as CachedRules
    
    // Check if cache is expired
    if (Date.now() - cached.fetchedAt > CACHE_DURATION_MS) {
      return null
    }

    return cached
  } catch (error) {
    console.error(`[PlatformRules] Error reading cache for ${platform}:`, error)
    return null
  }
}

/**
 * Saves rules to chrome.storage.local
 */
async function cacheRules(
  platform: SupportedPlatform, 
  rules: OptimizationRule[], 
  source: "bundled" | "remote"
): Promise<void> {
  try {
    const key = `${CACHE_KEY_PREFIX}${platform}`
    const cached: CachedRules = {
      rules,
      fetchedAt: Date.now(),
      source,
    }
    await chrome.storage.local.set({ [key]: cached })
  } catch (error) {
    console.error(`[PlatformRules] Error caching rules for ${platform}:`, error)
  }
}

/**
 * Updates rules for a platform (tries remote, falls back to bundled)
 */
export async function updateRulesForPlatform(platform: SupportedPlatform): Promise<void> {
  // Try to get cached rules first
  const cached = await getCachedRules(platform)
  if (cached) {
    RUNTIME_RULES[platform] = cached.rules
    console.log(`[PlatformRules] Using cached rules for ${platform} (source: ${cached.source})`)
    return
  }

  // Try to fetch remote rules
  const remoteRules = await fetchRemoteRules(platform)
  
  if (remoteRules) {
    // Success: use remote rules
    RUNTIME_RULES[platform] = remoteRules
    await cacheRules(platform, remoteRules, "remote")
    clearSessionCache() // Invalidate AI session cache
    console.log(`[PlatformRules] Updated to remote rules for ${platform}`)
  } else {
    // Failure: use bundled rules
    RUNTIME_RULES[platform] = BUNDLED_RULES[platform]
    await cacheRules(platform, BUNDLED_RULES[platform], "bundled")
    console.log(`[PlatformRules] Falling back to bundled rules for ${platform}`)
  }
}

/**
 * Initializes rules for all platforms on extension startup
 */
export async function initializeRules(): Promise<void> {
  const platforms: SupportedPlatform[] = ["openai", "anthropic", "google"]
  await Promise.all(platforms.map(updateRulesForPlatform))
}

/**
 * Forces a refresh of rules from remote source
 */
export async function refreshRules(): Promise<void> {
  // Clear cache
  await chrome.storage.local.remove([
    `${CACHE_KEY_PREFIX}openai`,
    `${CACHE_KEY_PREFIX}anthropic`,
    `${CACHE_KEY_PREFIX}google`,
  ])
  
  // Re-fetch
  await initializeRules()
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
    return RUNTIME_RULES.openai.map((r) => r.rule)
  }
  return RUNTIME_RULES[platform].map((r) => r.rule)
}

/**
 * Gets full optimization rule objects for a platform
 *
 * @param platform - The LLM platform to get rules for
 * @returns Array of OptimizationRule objects
 */
export function getFullRulesForPlatform(platform: Platform): OptimizationRule[] {
  if (platform === "unknown") {
    return [...RUNTIME_RULES.openai]
  }
  return [...RUNTIME_RULES[platform]]
}

/**
 * Gets the total count of rules across all platforms
 */
export function getRuleCount(): number {
  return (
    RUNTIME_RULES.openai.length +
    RUNTIME_RULES.anthropic.length +
    RUNTIME_RULES.google.length
  )
}

/**
 * Gets all rules across all platforms
 */
export function getAllRules(): OptimizationRule[] {
  return [
    ...RUNTIME_RULES.openai,
    ...RUNTIME_RULES.anthropic,
    ...RUNTIME_RULES.google,
  ]
}
