/**
 * AI Engine - Wrapper for Chrome's window.ai (Gemini Nano) API
 *
 * Provides a clean interface for checking AI availability and
 * optimizing prompts using the local Gemini Nano model.
 */

import { type AIAvailability, type AIOptimizeOptions, PromptTunerError } from "~types"

// =============================================================================
// Constants
// =============================================================================

const CHROME_FLAGS_URL = "chrome://flags/#optimization-guide-on-device-model"

const SYSTEM_PROMPT_TEMPLATE = `You are an expert prompt engineer. Your task is to rewrite and optimize the user's prompt to be more effective.

Follow these rules when optimizing:
{rules}

Instructions:
1. Analyze the user's original prompt
2. Apply the relevant rules to improve it
3. Return ONLY the optimized prompt, nothing else
4. Maintain the user's original intent
5. Make the prompt clearer, more specific, and better structured`

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the window.ai API if available
 */
function getAI(): WindowAI | undefined {
  if (typeof globalThis !== "undefined" && "ai" in globalThis) {
    return globalThis.ai
  }
  if (typeof window !== "undefined" && "ai" in window) {
    return window.ai
  }
  return undefined
}

/**
 * Formats rules into a numbered list for the system prompt
 */
function formatRulesForPrompt(rules: string[]): string {
  if (rules.length === 0) {
    return "- Use clear, specific instructions\n- Be concise but complete"
  }
  return rules.map((rule, index) => `${String(index + 1)}. ${rule}`).join("\n")
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Checks if the Gemini Nano AI is available in the browser
 */
export async function checkAIAvailability(): Promise<AIAvailability> {
  const ai = getAI()

  if (!ai) {
    return {
      available: false,
      reason: `Gemini Nano not available. Please enable it at ${CHROME_FLAGS_URL}`,
    }
  }

  if (!ai.languageModel) {
    return {
      available: false,
      reason: `Language Model API not available. Please enable it at ${CHROME_FLAGS_URL}`,
    }
  }

  try {
    const capabilities = await ai.languageModel.capabilities()

    if (capabilities.available === "no") {
      return {
        available: false,
        reason: "Gemini Nano is not supported on this device or browser.",
      }
    }

    if (capabilities.available === "after-download") {
      return {
        available: false,
        needsDownload: true,
        reason: "Gemini Nano needs to be downloaded. This may happen automatically.",
      }
    }

    return { available: true }
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "Failed to check AI capabilities",
    }
  }
}

/**
 * Creates a language model session with the given system prompt
 */
async function createSession(
  systemPrompt: string,
  options?: AIOptimizeOptions
): Promise<LanguageModel> {
  const ai = getAI()

  if (!ai?.languageModel) {
    throw new PromptTunerError(
      `Gemini Nano not available. Please enable it at ${CHROME_FLAGS_URL}`,
      "AI_UNAVAILABLE"
    )
  }

  try {
    const session = await ai.languageModel.create({
      systemPrompt,
      temperature: options?.temperature ?? 0.3,
      topK: 40,
    })
    return session
  } catch (error) {
    throw new PromptTunerError(
      error instanceof Error ? error.message : "Failed to create AI session",
      "AI_SESSION_FAILED"
    )
  }
}

/**
 * Optimizes a prompt using Gemini Nano with the given rules
 *
 * @param draft - The original prompt to optimize
 * @param rules - Array of optimization rules to apply
 * @param options - Optional configuration for the AI
 * @returns The optimized prompt
 */
export async function optimizePrompt(
  draft: string,
  rules: string[],
  options?: AIOptimizeOptions
): Promise<string> {
  // Check availability first
  const availability = await checkAIAvailability()
  if (!availability.available) {
    throw new PromptTunerError(availability.reason ?? "AI not available", "AI_UNAVAILABLE")
  }

  // Build system prompt with rules
  const formattedRules = formatRulesForPrompt(rules)
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{rules}", formattedRules)

  let session: LanguageModel | null = null

  try {
    session = await createSession(systemPrompt, options)

    // Send the draft prompt for optimization
    const optimizedPrompt = await session.prompt(`Please optimize this prompt:\n\n${draft}`)

    // Clean up the response
    const cleaned = optimizedPrompt.trim()

    // Return the optimized prompt, or original if empty
    return cleaned || draft
  } catch (error) {
    if (error instanceof PromptTunerError) {
      throw error
    }

    throw new PromptTunerError(
      error instanceof Error ? error.message : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED"
    )
  } finally {
    session?.destroy()
  }
}

/**
 * Optimizes a prompt with streaming response
 *
 * @param draft - The original prompt to optimize
 * @param rules - Array of optimization rules to apply
 * @param onChunk - Callback for each chunk of the response
 * @param options - Optional configuration for the AI
 * @returns The complete optimized prompt
 */
export async function optimizePromptStreaming(
  draft: string,
  rules: string[],
  onChunk: (chunk: string) => void,
  options?: AIOptimizeOptions
): Promise<string> {
  const availability = await checkAIAvailability()
  if (!availability.available) {
    throw new PromptTunerError(availability.reason ?? "AI not available", "AI_UNAVAILABLE")
  }

  const formattedRules = formatRulesForPrompt(rules)
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{rules}", formattedRules)

  let session: LanguageModel | null = null

  try {
    session = await createSession(systemPrompt, options)

    const stream = session.promptStreaming(`Please optimize this prompt:\n\n${draft}`)

    const reader = stream.getReader()
    let result = ""

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      result += value
      onChunk(value)
    }

    return result.trim() || draft
  } catch (error) {
    if (error instanceof PromptTunerError) {
      throw error
    }

    throw new PromptTunerError(
      error instanceof Error ? error.message : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED"
    )
  } finally {
    session?.destroy()
  }
}
