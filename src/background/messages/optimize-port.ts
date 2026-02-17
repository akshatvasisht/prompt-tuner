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

/* eslint-disable @typescript-eslint/no-deprecated */

import { checkAIAvailability, optimizePromptStreaming } from "~lib/ai-engine";
import { logger } from "~lib/logger";
import { getRulesForPlatform } from "~lib/platform-rules";
import {
  type ErrorCode,
  type Platform,
  PromptTunerError,
  type OptimizePortRequest,
  type OptimizePortChunk,
  type OptimizePortComplete,
  type OptimizePortError,
} from "~types";

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
    request.type === MESSAGE_TYPES.START_OPTIMIZATION &&
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
    logger.warn("Failed to send chunk:", error);
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
    logger.warn("Failed to send completion:", error);
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
    logger.warn("Failed to send error:", error);
  }
}

// =============================================================================
// Port Handler
// =============================================================================

/**
 * Port handler for streaming AI optimization results
 * on a long-lived port
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
    logger.error("Error during optimization:", error);

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

import { PORT_NAMES, MESSAGE_TYPES } from "~lib/constants";

/**
 * Registers the port connection listener
 * Call this from background/index.ts during initialization
 */
export function registerOptimizePortHandler(): void {
  chrome.runtime.onConnect.addListener((port) => {
    // Only handle ports with the correct name
    if (port.name !== PORT_NAMES.OPTIMIZE) {
      return;
    }

    // Port connected (debug)
    // console.log("[OptimizePort] Port connected");

    // Handle messages on this port
    port.onMessage.addListener((message: unknown) => {
      if (typeof message !== "object" || message === null) {
        logger.error("Received invalid message from optimize port.");
        sendError(
          port,
          "INVALID_REQUEST",
          "Invalid optimization request format",
        );
        return;
      }
      if (!validateRequest(message)) {
        logger.error("Invalid request:", message);
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
  logger.info("Dummy handler - using manual port registration");
}
