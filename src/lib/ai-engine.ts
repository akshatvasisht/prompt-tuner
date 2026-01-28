/**
 * AI Engine - Wrapper for Chrome's Built-in AI (Gemini Nano) API
 *
 * Uses the Chrome 138+ stable LanguageModel API for local prompt optimization.
 * All processing happens on-device for complete privacy.
 *
 * @see https://developer.chrome.com/docs/extensions/ai/prompt-api
 */

import {
  type AIAvailability,
  type AIOptimizeOptions,
  PromptTunerError,
} from "~types";

// =============================================================================
// Constants
// =============================================================================

const CHROME_VERSION_INFO = "Requires Chrome 138+ with Gemini Nano enabled";

// =============================================================================
// Session Cache
// =============================================================================

/**
 * Global session cache to avoid recreation overhead (2-3s per request)
 * Cached session is reused when system prompt matches
 */
let cachedSession: LanguageModel | null = null;
let cachedSystemPrompt: string | null = null;

/**
 * Clears the cached session (called on rule changes or memory warnings)
 */
export function clearSessionCache(): void {
  if (cachedSession) {
    cachedSession.destroy();
    cachedSession = null;
    cachedSystemPrompt = null;
  }
}

const SYSTEM_PROMPT_TEMPLATE = `You are an expert prompt engineer. Your task is to rewrite and optimize the user's prompt to be more effective.

Follow these rules when optimizing:
{rules}

Instructions:
1. Analyze the user's original prompt carefully
2. Apply the relevant rules to improve clarity, structure, and effectiveness
3. Maintain the user's original intent and core message
4. Make the prompt more specific, well-structured, and actionable

CRITICAL: Return ONLY the optimized prompt wrapped in <result></result> tags, with NO additional commentary.

Examples:

Input: "make it summarize this article"
<result>Please provide a concise summary of the following article, highlighting the main points and key takeaways. Focus on factual accuracy and maintain a neutral tone. Structure your summary in 3-4 paragraphs covering: introduction, main arguments, and conclusion.</result>

Input: "write code for sorting"
<result>Please write clean, well-documented code that implements an efficient sorting algorithm. Include:
1. Function signature with type hints
2. Time and space complexity analysis in comments
3. Example usage with at least 3 test cases

Prefer built-in sorting methods when appropriate, but explain your choice.</result>

Now optimize this prompt:`;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Checks if the LanguageModel API is available in the current context
 */
function isLanguageModelAvailable(): boolean {
  return typeof LanguageModel !== "undefined";
}

/**
 * Formats rules into a numbered list for the system prompt
 */
function formatRulesForPrompt(rules: string[]): string {
  if (rules.length === 0) {
    return "- Use clear, specific instructions\n- Be concise but complete";
  }
  return rules.map((rule, index) => `${String(index + 1)}. ${rule}`).join("\n");
}

/**
 * Extracts the optimized prompt from XML tags, stripping meta-commentary
 */
function cleanModelOutput(rawOutput: string): string {
  // Try to extract content from <result> tags
  const resultMatch = /<result>([\s\S]*?)<\/result>/i.exec(rawOutput);

  if (resultMatch && resultMatch[1]) {
    return resultMatch[1].trim();
  }

  // Fallback: strip common meta-phrases if no tags found
  const cleaned = rawOutput
    .replace(/^(?:here is|here's|sure,?\s*|okay,?\s*)/i, "")
    .replace(/^(?:the\s+)?(?:optimized|improved|rewritten)\s+prompt:?\s*/i, "")
    .replace(/^["']|["']$/g, "") // Remove surrounding quotes
    .trim();

  return cleaned || rawOutput.trim();
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
    };
  }

  try {
    const availability = await LanguageModel.availability();

    switch (availability) {
      case "available":
        return { available: true };

      case "downloadable":
        return {
          available: false,
          needsDownload: true,
          reason:
            "Gemini Nano model can be downloaded. Visit chrome://components to trigger download.",
        };

      case "downloading":
        return {
          available: false,
          needsDownload: true,
          reason: "Gemini Nano model is currently downloading. Please wait.",
        };

      case "unavailable":
      default:
        return {
          available: false,
          reason:
            "Gemini Nano is not supported on this device or browser configuration.",
        };
    }
  } catch (error) {
    return {
      available: false,
      reason:
        error instanceof Error
          ? error.message
          : "Failed to check AI availability",
    };
  }
}

/**
 * Gets or creates a language model session with caching
 * Reuses cached session if system prompt matches, otherwise creates new one
 */
async function getOrCreateSession(
  systemPrompt: string,
  options?: AIOptimizeOptions,
): Promise<LanguageModel> {
  if (!isLanguageModelAvailable()) {
    throw new PromptTunerError(
      `LanguageModel API not available. ${CHROME_VERSION_INFO}`,
      "AI_UNAVAILABLE",
    );
  }

  // Check if we can reuse cached session
  if (cachedSession && cachedSystemPrompt === systemPrompt) {
    return cachedSession;
  }

  // Clear old session if exists
  if (cachedSession) {
    cachedSession.destroy();
  }

  // Create new session
  try {
    const session = await LanguageModel.create({
      initialPrompts: [{ role: "system", content: systemPrompt }],
      temperature: options?.temperature ?? 0.3,
      topK: 40,
    });

    // Cache the session
    cachedSession = session;
    cachedSystemPrompt = systemPrompt;

    return session;
  } catch (error) {
    throw new PromptTunerError(
      error instanceof Error ? error.message : "Failed to create AI session",
      "AI_SESSION_FAILED",
    );
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
  options?: AIOptimizeOptions,
): Promise<string> {
  // Check availability first
  const availability = await checkAIAvailability();
  if (!availability.available) {
    throw new PromptTunerError(
      availability.reason ?? "AI not available",
      "AI_UNAVAILABLE",
    );
  }

  // Build system prompt with rules
  const formattedRules = formatRulesForPrompt(rules);
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace(
    "{rules}",
    formattedRules,
  );

  try {
    const session = await getOrCreateSession(systemPrompt, options);

    // Send the draft prompt for optimization
    const optimizedPrompt = await session.prompt(
      `Please optimize this prompt:\n\n${draft}`,
    );

    // Clean up the response - extract from XML tags and strip meta-text
    const cleaned = cleanModelOutput(optimizedPrompt);

    // Return the optimized prompt, or original if empty
    return cleaned || draft;
  } catch (error) {
    if (error instanceof PromptTunerError) {
      throw error;
    }

    throw new PromptTunerError(
      error instanceof Error
        ? error.message
        : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED",
    );
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
  options?: AIOptimizeOptions,
): Promise<string> {
  const availability = await checkAIAvailability();
  if (!availability.available) {
    throw new PromptTunerError(
      availability.reason ?? "AI not available",
      "AI_UNAVAILABLE",
    );
  }

  const formattedRules = formatRulesForPrompt(rules);
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace(
    "{rules}",
    formattedRules,
  );

  try {
    const session = await getOrCreateSession(systemPrompt, options);

    const stream = session.promptStreaming(
      `Please optimize this prompt:\n\n${draft}`,
    );

    const reader = stream.getReader();
    let result = "";

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Chrome 138+ streaming returns delta tokens (new content only)
      result += value;
      onChunk(value);
    }

    // Clean up the response - extract from XML tags and strip meta-text
    const cleaned = cleanModelOutput(result);
    return cleaned || draft;
  } catch (error) {
    if (error instanceof PromptTunerError) {
      throw error;
    }

    throw new PromptTunerError(
      error instanceof Error
        ? error.message
        : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED",
    );
  }
}
