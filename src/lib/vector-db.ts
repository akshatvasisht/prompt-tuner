/**
 * Vector Database - Orama wrapper for storing and searching optimization rules
 *
 * Uses Orama for client-side full-text search with platform filtering.
 */

import { create, insert, search, type Orama, type Results } from "@orama/orama"
import { type OptimizationRule, type Platform, type SupportedPlatform, type VectorSearchResult } from "~types"

// =============================================================================
// Types
// =============================================================================

interface RuleSchema {
  id: string
  platform: string
  rule: string
  title: string
  description: string
  tags: string
}

type RuleDatabase = Orama<{
  id: "string"
  platform: "string"
  rule: "string"
  title: "string"
  description: "string"
  tags: "string"
}>

interface OramaSearchHit {
  id: string
  document: RuleSchema
  score: number
}

// =============================================================================
// Singleton Instance
// =============================================================================

let dbInstance: RuleDatabase | null = null
let isInitialized = false

// =============================================================================
// Hardcoded Golden Rules
// =============================================================================

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

// =============================================================================
// Database Management
// =============================================================================

/**
 * Initializes the Orama database instance
 */
export async function initializeDatabase(): Promise<void> {
  if (isInitialized && dbInstance) {
    return
  }

  try {
    // Orama's create is synchronous in v3
    dbInstance = create({
      schema: {
        id: "string",
        platform: "string",
        rule: "string",
        title: "string",
        description: "string",
        tags: "string",
      },
    })
    // Keep function async for API consistency
    await Promise.resolve()

    isInitialized = true
  } catch (error) {
    console.error("[VectorDB] Failed to initialize database:", error)
    throw error
  }
}

/**
 * Gets the database instance, initializing if needed
 */
async function getDatabase(): Promise<RuleDatabase> {
  if (!isInitialized || !dbInstance) {
    await initializeDatabase()
  }

  if (!dbInstance) {
    throw new Error("Database failed to initialize")
  }

  return dbInstance
}

/**
 * Inserts a rule into the database
 */
async function insertRule(rule: OptimizationRule): Promise<void> {
  const db = await getDatabase()

  await insert(db, {
    id: rule.id,
    platform: rule.platform,
    rule: rule.rule,
    title: rule.title ?? "",
    description: rule.description ?? "",
    tags: rule.tags?.join(" ") ?? "",
  })
}

/**
 * Seeds the database with hardcoded optimization rules
 */
export async function seedDatabase(): Promise<void> {
  await getDatabase()

  const allRules = [...OPENAI_RULES, ...ANTHROPIC_RULES, ...GOOGLE_RULES]

  for (const rule of allRules) {
    try {
      await insertRule(rule)
    } catch (error) {
      console.warn(`[VectorDB] Could not insert rule ${rule.id}:`, error)
    }
  }
}

/**
 * Resets the database
 */
export async function resetDatabase(): Promise<void> {
  dbInstance = null
  isInitialized = false
  await initializeDatabase()
  await seedDatabase()
}

// =============================================================================
// Search Functions
// =============================================================================

/**
 * Searches for relevant rules based on query and platform
 */
export async function searchRules(
  query: string,
  platform: Platform,
  limit = 3
): Promise<string[]> {
  const targetPlatform = platform === "unknown" ? undefined : platform
  const db = await getDatabase()

  try {
    const searchOptions: Parameters<typeof search>[1] = {
      term: query,
      limit: limit * 2,
      tolerance: 2,
      boost: {
        rule: 2,
        title: 1.5,
        tags: 1,
      },
    }

    if (targetPlatform) {
      searchOptions.where = {
        platform: targetPlatform,
      }
    }

    const results = (await search(db, searchOptions)) as Results<RuleSchema>
    const rules = results.hits.slice(0, limit).map((hit: OramaSearchHit) => hit.document.rule)

    if (rules.length === 0 && targetPlatform) {
      return getAllRulesForPlatform(targetPlatform)
    }

    return rules
  } catch (error) {
    console.error("[VectorDB] Search failed:", error)
    return getAllRulesForPlatform(targetPlatform ?? "openai")
  }
}

/**
 * Gets all rules for a specific platform
 */
export function getAllRulesForPlatform(platform: string): string[] {
  switch (platform) {
    case "openai":
      return OPENAI_RULES.map(r => r.rule)
    case "anthropic":
      return ANTHROPIC_RULES.map(r => r.rule)
    case "google":
      return GOOGLE_RULES.map(r => r.rule)
    default:
      return OPENAI_RULES.map(r => r.rule)
  }
}

/**
 * Searches for rules and returns full VectorSearchResult objects
 */
export async function searchRulesWithScores(
  query: string,
  platform: Platform,
  limit = 3
): Promise<VectorSearchResult[]> {
  const targetPlatform = platform === "unknown" ? undefined : platform
  const db = await getDatabase()

  try {
    const searchOptions: Parameters<typeof search>[1] = {
      term: query,
      limit: limit * 2,
      tolerance: 2,
    }

    if (targetPlatform) {
      searchOptions.where = {
        platform: targetPlatform,
      }
    }

    const results = (await search(db, searchOptions)) as Results<RuleSchema>

    return results.hits.slice(0, limit).map((hit: OramaSearchHit) => ({
      rule: {
        id: hit.document.id,
        platform: hit.document.platform as SupportedPlatform,
        rule: hit.document.rule,
        title: hit.document.title,
        description: hit.document.description,
        tags: hit.document.tags ? hit.document.tags.split(" ") : undefined,
      },
      score: hit.score,
    }))
  } catch (error) {
    console.error("[VectorDB] Search with scores failed:", error)
    return []
  }
}

/**
 * Checks if the database has been initialized and seeded
 */
export function isDatabaseReady(): boolean {
  return isInitialized && dbInstance !== null
}

/**
 * Gets the count of rules in the database
 */
export async function getRuleCount(): Promise<number> {
  if (!isInitialized || !dbInstance) {
    return 0
  }

  try {
    const results = await search(dbInstance, { term: "", limit: 100 })
    return results.count
  } catch {
    return 0
  }
}
