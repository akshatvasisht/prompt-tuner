/**
 * Optimize Message Handler
 *
 * Handles prompt optimization requests from content scripts:
 * 1. Receives draft prompt and platform
 * 2. Searches VectorDB for relevant optimization rules
 * 3. Calls AI Engine to optimize the prompt
 * 4. Returns the optimized result
 */

import { type PlasmoMessaging } from "@plasmohq/messaging"
import { type OptimizeRequest, type OptimizeResponse, type ErrorCode, type Platform, PromptTunerError } from "~types"
import { searchRules, initializeDatabase, seedDatabase, isDatabaseReady } from "~lib/vector-db"
import { optimizePrompt, checkAIAvailability } from "~lib/ai-engine"

// =============================================================================
// Validation
// =============================================================================

const VALID_PLATFORMS: Platform[] = ["openai", "anthropic", "google", "unknown"]

function validateRequest(body: unknown): body is OptimizeRequest {
  if (!body || typeof body !== "object") return false

  const request = body as Record<string, unknown>

  if (typeof request.draft !== "string" || request.draft.trim().length === 0) {
    return false
  }

  if (!VALID_PLATFORMS.includes(request.platform as Platform)) {
    return false
  }

  if (request.context !== undefined && typeof request.context !== "string") {
    return false
  }

  return true
}

// =============================================================================
// Response Helpers
// =============================================================================

function errorResponse(code: ErrorCode, message: string, originalPrompt: string): OptimizeResponse {
  return {
    success: false,
    optimizedPrompt: originalPrompt,
    appliedRules: [],
    error: { code, message },
  }
}

function successResponse(optimizedPrompt: string, appliedRules: string[]): OptimizeResponse {
  return {
    success: true,
    optimizedPrompt,
    appliedRules,
  }
}

// =============================================================================
// Database Initialization
// =============================================================================

async function ensureDatabaseReady(): Promise<void> {
  if (!isDatabaseReady()) {
    await initializeDatabase()
    await seedDatabase()
  }
}

// =============================================================================
// Message Handler
// =============================================================================

const handler: PlasmoMessaging.MessageHandler<OptimizeRequest, OptimizeResponse> = async (
  req,
  res
) => {
  // Validate request
  if (!validateRequest(req.body)) {
    console.error("[Optimize] Invalid request:", req.body)
    res.send(
      errorResponse(
        "INVALID_REQUEST",
        "Invalid request: draft prompt and platform are required",
        ""
      )
    )
    return
  }

  const { draft, platform } = req.body

  try {
    // Step 1: Ensure database is ready
    await ensureDatabaseReady()

    // Step 2: Search for relevant rules
    const rules = await searchRules(draft, platform, 3)

    // Step 3: Check AI availability
    const aiStatus = await checkAIAvailability()

    if (!aiStatus.available) {
      console.warn("[Optimize] AI not available:", aiStatus.reason)
      res.send(
        errorResponse(
          "AI_UNAVAILABLE",
          aiStatus.reason ??
            "Gemini Nano is not available. Please enable chrome://flags/#optimization-guide-on-device-model",
          draft
        )
      )
      return
    }

    // Step 4: Optimize the prompt using AI
    const optimizedPrompt = await optimizePrompt(draft, rules)

    // Step 5: Return success response
    res.send(successResponse(optimizedPrompt, rules))
  } catch (error) {
    console.error("[Optimize] Error during optimization:", error)

    if (error instanceof PromptTunerError) {
      res.send(errorResponse(error.code, error.message, draft))
      return
    }

    const message = error instanceof Error ? error.message : "Unknown error during optimization"
    res.send(errorResponse("UNKNOWN_ERROR", message, draft))
  }
}

export default handler
