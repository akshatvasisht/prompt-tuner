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

import {
  checkAIAvailability,
  optimizePromptStreaming,
  optimizeWithRefineChain,
  optimizeWithMapReduce,
  optimizeWithWriter,
  optimizeWithRewriter,
  optimizeWithDecomposition,
  optimizeWithHierarchical,
  resolveContextLimit,
  measureDraft,
} from "~lib/ai-engine";
import { logger } from "~lib/logger";
import { getFullRulesForPlatform, getRulesVersion } from "~lib/platform-rules";
import { getActionById } from "~lib/actions";
import { fnv1a64 } from "~lib/hash";
import { setKeepAlive } from "../index";
import {
  type ErrorCode,
  type Platform,
  PromptTunerError,
  type OptimizePortRequest,
  type OptimizePortChunk,
  type OptimizePortComplete,
  type OptimizePortError,
  type OptimizePortTokenInfo,
  type OptimizePortStage,
  type AIOptimizeOptions,
} from "~types";

// =============================================================================
// Validation
// =============================================================================

const STREAM_TIMEOUT_MS = 60_000;

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

function sendTokenInfo(
  port: chrome.runtime.Port,
  count: number,
  limit: number,
): void {
  const message: OptimizePortTokenInfo = {
    type: "TOKEN_INFO",
    count,
    limit,
  };
  try {
    port.postMessage(message);
  } catch (error) {
    logger.warn("Failed to send token info:", error);
  }
}

function sendStage(port: chrome.runtime.Port, stage: string): void {
  const message: OptimizePortStage = { type: "STAGE", stage };
  try {
    port.postMessage(message);
  } catch (error) {
    logger.warn("Failed to send stage:", error);
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
// Result Cache (Phase 6)
// =============================================================================

const CACHE_STORAGE_KEY = "optimize-result-cache";
const CACHE_MAX_ENTRIES = 20;

interface CacheEntry {
  key: string;
  result: string;
  rules: string[];
  ts: number;
}

function cacheKeyFor(draft: string, actionId: string): string {
  return fnv1a64(`${actionId}::${getRulesVersion()}::${draft}`);
}

async function readCache(): Promise<CacheEntry[]> {
  try {
    const sessionStorage = (
      chrome.storage as unknown as {
        session?: chrome.storage.StorageArea;
      }
    ).session;
    if (!sessionStorage) return [];
    const raw = (await sessionStorage.get(CACHE_STORAGE_KEY)) as Record<
      string,
      unknown
    >;
    const entries = raw[CACHE_STORAGE_KEY];
    if (!Array.isArray(entries)) return [];
    return entries as CacheEntry[];
  } catch (error) {
    logger.warn("Failed to read result cache:", error);
    return [];
  }
}

async function writeCache(entries: CacheEntry[]): Promise<void> {
  try {
    const sessionStorage = (
      chrome.storage as unknown as {
        session?: chrome.storage.StorageArea;
      }
    ).session;
    if (!sessionStorage) return;
    await sessionStorage.set({ [CACHE_STORAGE_KEY]: entries });
  } catch (error) {
    logger.warn("Failed to write result cache:", error);
  }
}

async function getCachedResult(key: string): Promise<CacheEntry | undefined> {
  const entries = await readCache();
  return entries.find((e) => e.key === key);
}

async function putCachedResult(entry: CacheEntry): Promise<void> {
  const entries = await readCache();
  const filtered = entries.filter((e) => e.key !== entry.key);
  filtered.unshift(entry);
  while (filtered.length > CACHE_MAX_ENTRIES) filtered.pop();
  await writeCache(filtered);
}

// =============================================================================
// Port Handler
// =============================================================================

/**
 * Port handler for streaming AI optimization results
 */
async function handleOptimizationRequest(
  port: chrome.runtime.Port,
  request: OptimizePortRequest,
  signal: AbortSignal,
): Promise<void> {
  const timeout = setTimeout(() => {
    sendError(port, "UNKNOWN_ERROR", "Optimization timed out after 60 seconds");
    try {
      port.disconnect();
    } catch {
      /* already disconnected */
    }
  }, STREAM_TIMEOUT_MS);

  const { draft, platform } = request;

  try {
    const allRules = getFullRulesForPlatform(platform);

    // Dynamic Rule Routing: Filter rules based on the specific action selected
    let activeRules = allRules;
    if (request.action !== "optimize") {
      const actionToTags: Record<string, string[]> = {
        "few-shot": ["examples", "few-shot", "demonstration"],
        "chain-of-thought": ["reasoning", "chain-of-thought", "steps"],
        "assign-role": ["persona", "role", "context"],
        "define-output": ["format", "output", "structure"],
        "add-constraints": ["length", "detail", "constraints", "instructions"],
        "break-down": ["decomposition", "steps", "structure", "complex-tasks"],
      };

      const relevantTags = actionToTags[request.action] ?? [];

      activeRules = allRules.filter((r) => {
        const isFoundational =
          (r.tags?.includes("structure") ?? false) ||
          (r.tags?.includes("clarity") ?? false);
        const isRelevant =
          r.tags?.some((tag) => relevantTags.includes(tag)) ?? false;
        return isFoundational || isRelevant;
      });
    }

    const ruleStrings = activeRules.map((r) => r.rule);

    // Cache check
    const cacheKey = cacheKeyFor(draft, request.action);
    const cached = await getCachedResult(cacheKey);
    if (cached) {
      sendStage(port, "cached");
      sendChunk(port, cached.result);
      clearTimeout(timeout);
      sendComplete(port, cached.result, cached.rules);
      return;
    }

    // AI availability
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

    const onChunk = (chunk: string): void => {
      sendChunk(port, chunk);
    };

    const baseOptions: AIOptimizeOptions = {
      signal,
      onTokenCount: (count, limit) => {
        sendTokenInfo(port, count, limit);
      },
      onStage: (stage: string) => {
        sendStage(port, stage);
      },
    };

    // Token-size based dispatch for the generic prompt-engine path.
    // The specialised actions (pattern / engine overrides) run their own paths.
    const action = getActionById(request.action);
    const pattern = action?.pattern ?? "single";
    const engine = action?.engine ?? "prompt";

    let optimizedPrompt: string;

    if (pattern === "recursive") {
      optimizedPrompt = await optimizeWithDecomposition(
        draft,
        ruleStrings,
        onChunk,
        baseOptions,
      );
    } else if (engine === "writer") {
      optimizedPrompt = await optimizeWithWriter(
        draft,
        ruleStrings,
        onChunk,
        baseOptions,
      );
    } else if (engine === "rewriter") {
      optimizedPrompt = await optimizeWithRewriter(
        draft,
        ruleStrings,
        onChunk,
        baseOptions,
      );
    } else {
      // Prompt-engine path - decide by token size using Nano's native tokenizer.
      const limit = await resolveContextLimit();
      const tokens = await measureDraft(draft);
      sendTokenInfo(port, tokens, limit);

      if (tokens > 2.0 * limit) {
        optimizedPrompt = await optimizeWithHierarchical(
          draft,
          ruleStrings,
          onChunk,
          baseOptions,
        );
      } else if (tokens > 0.85 * limit) {
        optimizedPrompt = await optimizeWithMapReduce(
          draft,
          ruleStrings,
          onChunk,
          baseOptions,
        );
      } else if (request.action === "optimize") {
        optimizedPrompt = await optimizeWithRefineChain(
          draft,
          ruleStrings,
          onChunk,
          baseOptions,
        );
      } else {
        optimizedPrompt = await optimizePromptStreaming(
          draft,
          ruleStrings,
          onChunk,
          baseOptions,
        );
      }
    }

    clearTimeout(timeout);
    sendComplete(port, optimizedPrompt, ruleStrings);

    void putCachedResult({
      key: cacheKey,
      result: optimizedPrompt,
      rules: ruleStrings,
      ts: Date.now(),
    });
  } catch (error) {
    clearTimeout(timeout);
    logger.error("Error during optimization:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return;
    }

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

export function registerOptimizePortHandler(): void {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_NAMES.OPTIMIZE) {
      return;
    }

    let controller: AbortController | null = null;

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

      const typed = message as Record<string, unknown>;
      if (typed.type === MESSAGE_TYPES.CANCEL_OPTIMIZATION) {
        controller?.abort();
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

      // Fresh controller per request; previous (if any) is replaced.
      controller?.abort();
      controller = new AbortController();
      void handleOptimizationRequest(port, message, controller.signal);
    });

    port.onDisconnect.addListener(() => {
      // A disconnect mid-stream is a cancel signal - abort any in-flight work.
      controller?.abort();
      setKeepAlive(false);
    });

    setKeepAlive(true);
  });
}

// =============================================================================
// Default Export (for Plasmo compatibility)
// =============================================================================

export default function (): void {
  logger.info("Manual port registration");
}
