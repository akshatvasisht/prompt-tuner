/**
 * AI Engine - Wrapper for Chrome's Built-in AI (Gemini Nano) API
 *
 * Uses the Chrome 138+ stable LanguageModel API for local prompt optimization.
 * All processing happens on-device for complete privacy.
 *
 * @see https://developer.chrome.com/docs/extensions/ai/prompt-api
 */

import { type AIAvailability, type AIOptimizeOptions, PromptTunerError } from "~types"

// =============================================================================
// Constants
// =============================================================================

const CHROME_VERSION_INFO = "Requires Chrome 138+ with Gemini Nano enabled"

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
 * Checks if the LanguageModel API is available in the current context
 */
function isLanguageModelAvailable(): boolean {
  return typeof LanguageModel !== "undefined"
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
 *
 * Chrome 138+ availability states:
 * - "available": Model is ready to use
 * - "downloadable": Model can be downloaded
 * - "downloading": Model is currently downloading
 * - "unavailable": Model is not supported on this device
 */
export async function checkAIAvailability(): Promise<AIAvailability> {
  if (!isLanguageModelAvailable()) {
    return {
      available: false,
      reason: `LanguageModel API not available. ${CHROME_VERSION_INFO}`,
    }
  }

  try {
    const availability = await LanguageModel.availability()

    switch (availability) {
      case "available":
        return { available: true }

      case "downloadable":
        return {
          available: false,
          needsDownload: true,
          reason: "Gemini Nano model can be downloaded. Visit chrome://components to trigger download.",
        }

      case "downloading":
        return {
          available: false,
          needsDownload: true,
          reason: "Gemini Nano model is currently downloading. Please wait.",
        }

      case "unavailable":
      default:
        return {
          available: false,
          reason: "Gemini Nano is not supported on this device or browser configuration.",
        }
    }
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "Failed to check AI availability",
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
  if (!isLanguageModelAvailable()) {
    throw new PromptTunerError(
      `LanguageModel API not available. ${CHROME_VERSION_INFO}`,
      "AI_UNAVAILABLE"
    )
  }

  try {
    const session = await LanguageModel.create({
      initialPrompts: [
        { role: "system", content: systemPrompt },
      ],
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
 * @param onChunk - Callback for each chunk of the response (receives delta tokens)
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

      // Chrome 138+ streaming returns delta tokens (new content only)
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
