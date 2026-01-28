/**
 * Optimize Port Handler - Long-lived connection for streaming
 *
 * Replaces single-fire messaging with persistent port connections
 * to enable token-by-token streaming from Gemini Nano to the UI.
 *
 * Architecture:
 * 1. Content script opens port with chrome.runtime.connect()
 * 2. Background maintains port connection during optimization
 * 3. Streams tokens incrementally via port.postMessage()
 * 4. Closes port on completion or error
 *
 * Benefits:
 * - Streaming UI updates (no waiting for full response)
 * - Lower perceived latency
 * - Better UX for long generations
 * - Connection stays alive during streaming
 */

import { checkAIAvailability, optimizePromptStreaming } from "~lib/ai-engine";
import { getRulesForPlatform } from "~lib/platform-rules";
import { type ErrorCode, type Platform, PromptTunerError } from "~types";

// =============================================================================
// Types
// =============================================================================

interface OptimizePortRequest {
  type: "START_OPTIMIZATION";
  draft: string;
  platform: Platform;
}

interface OptimizePortChunk {
  type: "CHUNK";
  data: string;
}

interface OptimizePortComplete {
  type: "COMPLETE";
  optimizedPrompt: string;
  appliedRules: string[];
}

interface OptimizePortError {
  type: "ERROR";
  code: ErrorCode;
  message: string;
}

type OptimizePortMessage =
  | OptimizePortChunk
  | OptimizePortComplete
  | OptimizePortError;

// Suppress warning about unused type (used for documentation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _OptimizePortResponse = OptimizePortMessage;

// =============================================================================
// Validation
// =============================================================================

const VALID_PLATFORMS: Platform[] = [
  "openai",
  "anthropic",
  "google",
  "unknown",
];

function validateRequest(data: unknown): data is OptimizePortRequest {
  if (!data || typeof data !== "object") return false;

  const request = data as Record<string, unknown>;

  return (
    request.type === "START_OPTIMIZATION" &&
    typeof request.draft === "string" &&
    request.draft.trim().length > 0 &&
    VALID_PLATFORMS.includes(request.platform as Platform)
  );
}

// =============================================================================
// Port Message Helpers
// =============================================================================

function sendChunk(port: chrome.runtime.Port, data: string): void {
  const message: OptimizePortChunk = {
    type: "CHUNK",
    data,
  };
  try {
    port.postMessage(message);
  } catch (error) {
    // Port disconnected - silently fail
    console.warn("[OptimizePort] Failed to send chunk:", error);
  }
}

function sendComplete(
  port: chrome.runtime.Port,
  optimizedPrompt: string,
  rules: string[],
): void {
  const message: OptimizePortComplete = {
    type: "COMPLETE",
    optimizedPrompt,
    appliedRules: rules,
  };
  try {
    port.postMessage(message);
  } catch (error) {
    console.warn("[OptimizePort] Failed to send completion:", error);
  }
}

function sendError(
  port: chrome.runtime.Port,
  code: ErrorCode,
  errorMessage: string,
): void {
  const message: OptimizePortError = {
    type: "ERROR",
    code,
    message: errorMessage,
  };
  try {
    port.postMessage(message);
  } catch (error) {
    console.warn("[OptimizePort] Failed to send error:", error);
  }
}

// =============================================================================
// Port Handler
// =============================================================================

/**
 * Handles optimization requests on a long-lived port
 */
async function handleOptimizationRequest(
  port: chrome.runtime.Port,
  request: OptimizePortRequest,
): Promise<void> {
  const { draft, platform } = request;

  try {
    // Step 1: Get platform-specific rules
    const rules = getRulesForPlatform(platform);

    // Step 2: Check AI availability
    const aiStatus = await checkAIAvailability();

    if (!aiStatus.available) {
      sendError(
        port,
        "AI_UNAVAILABLE",
        aiStatus.reason ??
          "Gemini Nano is not available. Requires Chrome 138+.",
      );
      return;
    }

    // Step 3: Stream optimization with token-by-token updates
    const optimizedPrompt = await optimizePromptStreaming(
      draft,
      rules,
      (chunk: string) => {
        sendChunk(port, chunk);
      },
    );

    // Step 4: Send completion message
    sendComplete(port, optimizedPrompt, rules);
  } catch (error) {
    console.error("[OptimizePort] Error during optimization:", error);

    if (error instanceof PromptTunerError) {
      sendError(port, error.code, error.message);
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error during optimization";
    sendError(port, "UNKNOWN_ERROR", message);
  }
}

// =============================================================================
// Port Connection Listener
// =============================================================================

/**
 * Registers the port connection listener
 * Call this from background/index.ts during initialization
 */
export function registerOptimizePortHandler(): void {
  /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  chrome.runtime.onConnect.addListener((port) => {
    // Only handle ports with the correct name
    if (port.name !== "optimize-port") {
      return;
    }

    // Port connected (debug)
    // console.log("[OptimizePort] Port connected");

    // Handle messages on this port
    port.onMessage.addListener((message: unknown) => {
      if (!validateRequest(message)) {
        console.error("[OptimizePort] Invalid request:", message);
        sendError(
          port,
          "INVALID_REQUEST",
          "Invalid optimization request format",
        );
        return;
      }

      // Handle the optimization request (async)
      void handleOptimizationRequest(port, message);
    });

    // Handle port disconnect
    port.onDisconnect.addListener(() => {
      // Port disconnected (debug)
      // console.log("[OptimizePort] Port disconnected");
      // Cleanup if needed
    });
  });
  /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  // Handler registered (debug)
  // console.log("[OptimizePort] Handler registered");
}

// =============================================================================
// Default Export (for Plasmo compatibility)
// =============================================================================

/**
 * Dummy export for Plasmo - actual handler is registered via registerOptimizePortHandler()
 * Plasmo's message handler pattern expects a default export, but we use manual port registration
 */
export default function (): void {
  // No-op: Port handler is registered in background/index.ts
  console.log("[OptimizePort] Dummy handler - using manual port registration");
}
