/**
 * Platform Rules - Optimization rules for different LLM platforms
 *
 * Simple, synchronous rule lookup by platform. No database overhead.
 * Rules are bundled with the extension for offline capability and privacy.
 */

import { type OptimizationRule, type Platform, type SupportedPlatform } from "~types"

// =============================================================================
// Platform-Specific Golden Rules
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
// Platform Rules Map
// =============================================================================

const PLATFORM_RULES: Record<SupportedPlatform, OptimizationRule[]> = {
  openai: OPENAI_RULES,
  anthropic: ANTHROPIC_RULES,
  google: GOOGLE_RULES,
}

// =============================================================================
// Public API
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
    return OPENAI_RULES.map((r) => r.rule)
  }
  return PLATFORM_RULES[platform].map((r) => r.rule)
}

/**
 * Gets full optimization rule objects for a platform
 *
 * @param platform - The LLM platform to get rules for
 * @returns Array of OptimizationRule objects
 */
export function getFullRulesForPlatform(platform: Platform): OptimizationRule[] {
  if (platform === "unknown") {
    return [...OPENAI_RULES]
  }
  return [...PLATFORM_RULES[platform]]
}

/**
 * Gets the total count of rules across all platforms
 */
export function getRuleCount(): number {
  return OPENAI_RULES.length + ANTHROPIC_RULES.length + GOOGLE_RULES.length
}

/**
 * Gets all rules across all platforms
 */
export function getAllRules(): OptimizationRule[] {
  return [...OPENAI_RULES, ...ANTHROPIC_RULES, ...GOOGLE_RULES]
}
