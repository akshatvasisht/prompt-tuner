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

import { logger } from "~lib/logger";
import { fnv1a32 } from "~lib/hash";

// =============================================================================
// Constants
// =============================================================================

const CHROME_VERSION_INFO = "Requires Chrome 138+ with Gemini Nano enabled";

/**
 * Fallback input budget when session.inputQuota is unreadable.
 * Chrome 138+ Nano advertises ~6144 tokens; we reserve headroom for the
 * system prompt and reply, yielding a ~4K practical ceiling for user input.
 */
const MAX_INPUT_TOKENS = 4096;

/**
 * Base system prompt — generic checklist + output contract, platform rules
 * appended per-clone via `session.append()`. Keeping the base prompt generic
 * lets us reuse the warmed KV-cache across rule sets.
 */
const BASE_SYSTEM_PROMPT = `You are an expert prompt engineer. Improve the user's prompt by applying only the relevant items from this checklist:

Improvement Checklist:
- Specify the task clearly (who, what, for whom)
- Add missing context the model needs
- Define the desired output format if absent
- Set appropriate tone and style
- Remove ambiguity and vague language
- Add constraints or boundaries if missing
- Structure with clear sections if multi-part

Instructions:
1. Analyze the original prompt
2. Apply only the checklist items that are relevant — do NOT pad or over-engineer
3. Maintain the user's original intent and voice
4. Keep improvements proportional to the input length

CRITICAL: Return ONLY the improved prompt. No preamble, no commentary, no surrounding tags or quotes.`;

// =============================================================================
// Session Cache — clone pool
// =============================================================================

let baseSession: LanguageModel | null = null;
const clonePool = new Map<string, LanguageModel>();

/** Tracks whether `append()` worked at least once. If never, we assume the
 * current Chrome build doesn't support it and switch to a per-rule-set
 * recreate strategy (still caching by rules key). */
let appendSupported: boolean | null = null;

function hashRules(rules: string[]): string {
  return fnv1a32(rules.join("|"));
}

function safeDestroy(session: LanguageModel | null): void {
  if (!session) return;
  try {
    session.destroy();
  } catch (e) {
    logger.warn("Error destroying session", e);
  }
}

/**
 * Clears the cached session and all clones (called on rule changes or memory warnings)
 */
export function clearSessionCache(): void {
  safeDestroy(baseSession);
  baseSession = null;
  for (const s of clonePool.values()) safeDestroy(s);
  clonePool.clear();
}

// =============================================================================
// Helper Functions
// =============================================================================

function isLanguageModelAvailable(): boolean {
  return typeof LanguageModel !== "undefined";
}

/**
 * Reads the session's reported input quota (Chrome 138+) with a safe fallback.
 */
function resolveInputLimit(session: LanguageModel): number {
  return typeof session.inputQuota === "number" && session.inputQuota > 0
    ? session.inputQuota
    : MAX_INPUT_TOKENS;
}

/**
 * Uses the session's native token counter when available; returns 0 otherwise.
 */
async function measureTokens(
  session: LanguageModel,
  input: string,
): Promise<number> {
  try {
    return await session.measureInputUsage(input);
  } catch {
    return 0;
  }
}

/**
 * AbortError (user-cancelled a stream) should not tear down the cached
 * session — the Prompt API preserves context across aborts.
 */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function formatRulesForPrompt(rules: string[]): string {
  if (rules.length === 0) {
    return "- Use clear, specific instructions\n- Be concise but complete";
  }
  return rules.map((rule, index) => `${String(index + 1)}. ${rule}`).join("\n");
}

/**
 * Legacy fallback used when the model prepends conversational framing.
 * The responseConstraint / "return only the improved prompt" instruction
 * is the primary contract; this is a defensive cleanup.
 */
function cleanModelOutput(rawOutput: string): string {
  const resultMatch = /<result>([\s\S]*?)<\/result>/i.exec(rawOutput);
  if (resultMatch?.[1]) {
    return resultMatch[1].trim();
  }

  const cleaned = rawOutput
    .replace(/^(?:here is|here's|sure,?\s*|okay,?\s*)/i, "")
    .replace(/^(?:the\s+)?(?:optimized|improved|rewritten)\s+prompt:?\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  return cleaned || rawOutput.trim();
}

// =============================================================================
// Session Pool
// =============================================================================

async function createBaseSession(
  options?: AIOptimizeOptions,
): Promise<LanguageModel> {
  const session = await LanguageModel.create({
    initialPrompts: [{ role: "system", content: BASE_SYSTEM_PROMPT }],
    temperature: options?.temperature ?? 0.3,
    topK: 40,
    expectedOutputs: [{ type: "text", languages: ["en"] }],
  });
  return session;
}

async function getBaseSession(
  options?: AIOptimizeOptions,
): Promise<LanguageModel> {
  if (baseSession) return baseSession;
  baseSession = await createBaseSession(options);
  return baseSession;
}

/**
 * Find-or-clone: returns a session primed with the given rules. Clones the
 * warm base session (fast on Chrome with copy-on-write KV-cache) and appends
 * the rule set as a user-turn context. If `append()` is unsupported on the
 * current build, falls back to creating a full session with a combined
 * system prompt.
 */
async function getSessionForRules(
  rules: string[],
  options?: AIOptimizeOptions,
): Promise<LanguageModel> {
  if (!isLanguageModelAvailable()) {
    throw new PromptTunerError(
      `LanguageModel API not available. ${CHROME_VERSION_INFO}`,
      "AI_UNAVAILABLE",
    );
  }

  const key = hashRules(rules);
  const cached = clonePool.get(key);
  if (cached) return cached;

  // Fallback path: append() previously failed. Create a fresh session with
  // the rules folded into the system prompt.
  if (appendSupported === false) {
    const combined = `${BASE_SYSTEM_PROMPT}\n\nPlatform-specific rules:\n${formatRulesForPrompt(rules)}`;
    const session = await LanguageModel.create({
      initialPrompts: [{ role: "system", content: combined }],
      temperature: options?.temperature ?? 0.3,
      topK: 40,
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });
    clonePool.set(key, session);
    return session;
  }

  try {
    const base = await getBaseSession(options);
    const clone = await base.clone();
    if (rules.length > 0) {
      await clone.append([
        {
          role: "user",
          content: `Additional rules to apply when relevant:\n${formatRulesForPrompt(rules)}`,
        },
      ]);
    }
    appendSupported = true;
    clonePool.set(key, clone);
    return clone;
  } catch (error) {
    logger.warn(
      "Session clone/append failed — falling back to per-rule-set sessions",
      error,
    );
    appendSupported = false;
    return getSessionForRules(rules, options);
  }
}

// =============================================================================
// Public API
// =============================================================================

export async function checkAIAvailability(): Promise<AIAvailability> {
  if (!isLanguageModelAvailable()) {
    return {
      available: false,
      reason: `LanguageModel API not available. ${CHROME_VERSION_INFO}`,
    };
  }

  try {
    const availability = await LanguageModel.availability({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });

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
    logger.error("AI availability check failed", error);
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
 * Proactively warms up the AI engine by creating a base session (without
 * rules). Per-rule-set clones are created lazily at optimize time.
 */
export async function warmup(_rules: string[]): Promise<void> {
  try {
    const status = await checkAIAvailability();
    if (!status.available) return;

    await getBaseSession();
    logger.info("AI Engine warmed up successfully");
  } catch (error) {
    logger.warn("AI Engine warmup failed (non-critical):", error);
  }
}

export function shutdown(): void {
  if (baseSession || clonePool.size > 0) {
    logger.info("Shutting down AI Engine to release RAM");
    clearSessionCache();
  }
}

export function isWarmed(): boolean {
  return baseSession !== null;
}

/**
 * RAF-batching stream reader — forwards delta tokens to onChunk while
 * amortising high-frequency bursts over animation frames. Returns the full
 * concatenated string.
 */
async function streamToChunks(
  stream: ReadableStream<string>,
  onChunk: (chunk: string) => void,
): Promise<string> {
  const reader = stream.getReader();
  let result = "";
  let buffer = "";
  let isFlushing = false;

  const flush = (): void => {
    if (buffer) {
      onChunk(buffer);
      buffer = "";
    }
    isFlushing = false;
  };

  const scheduleFlush = (): void => {
    if (isFlushing) return;
    isFlushing = true;
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(flush);
    } else {
      setTimeout(flush, 16);
    }
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += value;
      buffer += value;
      scheduleFlush();
    }
  } catch (readError) {
    flush();
    throw readError;
  } finally {
    reader.releaseLock();
  }

  flush();
  return result;
}

/**
 * Optimizes a prompt using Gemini Nano with the given rules (non-streaming).
 */
export async function optimizePrompt(
  draft: string,
  rules: string[],
  options?: AIOptimizeOptions,
): Promise<string> {
  const availability = await checkAIAvailability();
  if (!availability.available) {
    throw new PromptTunerError(
      availability.reason ?? "AI not available",
      "AI_UNAVAILABLE",
    );
  }

  try {
    const session = await getSessionForRules(rules, options);

    const inputLimit = resolveInputLimit(session);
    const tokens = await measureTokens(session, draft);

    if (tokens > inputLimit) {
      throw new PromptTunerError(
        `Input too long (${String(tokens)} tokens). Gemini Nano is limited to local context. Please shorten your prompt.`,
        "INPUT_TOO_LONG",
      );
    }

    const optimizedPrompt = await session.prompt(draft, {
      signal: options?.signal,
    });
    const cleaned = cleanModelOutput(optimizedPrompt);

    return cleaned || draft;
  } catch (error) {
    logger.error("Optimization failed", error);
    if (!isAbortError(error)) {
      clearSessionCache();
    }
    if (error instanceof PromptTunerError) throw error;

    throw new PromptTunerError(
      error instanceof Error
        ? error.message
        : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED",
    );
  }
}

/**
 * Optimizes a prompt with streaming (single-shot path).
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

  try {
    const session = await getSessionForRules(rules, options);

    const inputLimit = resolveInputLimit(session);
    options?.signal?.throwIfAborted();

    const tokens = await measureTokens(session, draft);
    options?.onTokenCount?.(tokens, inputLimit);

    if (tokens > inputLimit) {
      throw new PromptTunerError(
        `Input too long (${String(tokens)} tokens). Gemini Nano is limited to local context. Please shorten your prompt.`,
        "INPUT_TOO_LONG",
      );
    }

    const stream = session.promptStreaming(draft, { signal: options?.signal });
    const result = await streamToChunks(stream, onChunk);
    const cleaned = cleanModelOutput(result);
    return cleaned || draft;
  } catch (error) {
    logger.error("Streaming optimization failed", error);
    if (!isAbortError(error)) {
      clearSessionCache();
    }
    if (error instanceof PromptTunerError) throw error;

    throw new PromptTunerError(
      error instanceof Error
        ? error.message
        : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED",
    );
  }
}

/**
 * Refine chain (Draft → Critique-silently → Polish).
 *
 * Turn 1: silent, non-streaming — model lists 2-3 improvements.
 * Turn 2: streaming — model applies the improvements and returns the final prompt.
 *
 * Used for the `optimize` action where quality matters more than latency.
 */
export async function optimizeWithRefineChain(
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

  try {
    const session = await getSessionForRules(rules, options);

    const inputLimit = resolveInputLimit(session);
    options?.signal?.throwIfAborted();

    const tokens = await measureTokens(session, draft);
    options?.onTokenCount?.(tokens, inputLimit);

    if (tokens > inputLimit) {
      throw new PromptTunerError(
        `Input too long (${String(tokens)} tokens). Gemini Nano is limited to local context. Please shorten your prompt.`,
        "INPUT_TOO_LONG",
      );
    }

    // Stage 1: critique (silent)
    options?.onStage?.("critiquing");
    options?.signal?.throwIfAborted();
    const critiquePrompt = `Here's a prompt: ${draft}\n\nList 2-3 concrete improvements that would help most. Be brief.`;
    const critique = await session.prompt(critiquePrompt, {
      signal: options?.signal,
    });

    // Stage 2: polish (streamed)
    options?.onStage?.("polishing");
    options?.signal?.throwIfAborted();
    const polishPrompt = `Improvements to apply:\n${critique}\n\nApply those improvements to the original prompt. Return ONLY the improved prompt, no preamble.`;
    const stream = session.promptStreaming(polishPrompt, {
      signal: options?.signal,
    });
    const result = await streamToChunks(stream, onChunk);
    const cleaned = cleanModelOutput(result);
    return cleaned || draft;
  } catch (error) {
    logger.error("Refine-chain optimization failed", error);
    if (!isAbortError(error)) {
      clearSessionCache();
    }
    if (error instanceof PromptTunerError) throw error;

    throw new PromptTunerError(
      error instanceof Error
        ? error.message
        : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED",
    );
  }
}

/**
 * Resolves Nano's context limit at runtime. Uses the warmed base session's
 * `inputQuota` when available; falls back to MAX_INPUT_TOKENS otherwise.
 */
export async function resolveContextLimit(): Promise<number> {
  if (!isLanguageModelAvailable()) return MAX_INPUT_TOKENS;
  try {
    const session = await getBaseSession();
    return resolveInputLimit(session);
  } catch {
    return MAX_INPUT_TOKENS;
  }
}

/**
 * Measures a draft against the base session's native tokenizer. Falls back
 * to a ~4 chars/token heuristic when Nano isn't available (unit tests or
 * non-Chrome environments). Returns 0 on measurement failure.
 */
export async function measureDraft(draft: string): Promise<number> {
  if (!isLanguageModelAvailable()) return Math.ceil(draft.length / 4);
  try {
    const session = await getBaseSession();
    const tokens = await measureTokens(session, draft);
    return tokens > 0 ? tokens : Math.ceil(draft.length / 4);
  } catch {
    return Math.ceil(draft.length / 4);
  }
}

// =============================================================================
// Phase 3 — Map-Reduce for long inputs
// =============================================================================

import {
  chunkByParagraphs,
  mapReduce,
  recursiveDecompose,
} from "~lib/decompose";

const MAP_CHUNK_HEADROOM = 0.35; // chunk cap = headroom × inputQuota

export async function optimizeWithMapReduce(
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

  try {
    const session = await getSessionForRules(rules, options);
    const inputLimit = resolveInputLimit(session);
    options?.signal?.throwIfAborted();

    const chunkCap = Math.max(256, Math.floor(inputLimit * MAP_CHUNK_HEADROOM));
    const measure = (s: string): Promise<number> => measureTokens(session, s);

    options?.onStage?.("chunking");
    const chunks = await chunkByParagraphs(draft, chunkCap, measure);

    if (chunks.length <= 1) {
      // Input fits — degrade to single-shot.
      const stream = session.promptStreaming(draft, { signal: options?.signal });
      const result = await streamToChunks(stream, onChunk);
      return cleanModelOutput(result) || draft;
    }

    options?.onStage?.("mapping");
    const result = await mapReduce({
      chunks,
      signal: options?.signal,
      map: async (chunk, index) => {
        options?.signal?.throwIfAborted();
        const mapPrompt = `Improve this section of a larger prompt (section ${String(index + 1)} of ${String(chunks.length)}): ${chunk}\n\nReturn only the improved section.`;
        return session.prompt(mapPrompt, { signal: options?.signal });
      },
      reduce: async (mapped) => {
        options?.signal?.throwIfAborted();
        options?.onStage?.("reducing");
        const joined = mapped
          .map((m, i) => `Section ${String(i + 1)}:\n${m}`)
          .join("\n\n");
        const reducePrompt = `Here are improved sections in order:\n\n${joined}\n\nStitch them into one coherent prompt. Return only the final prompt.`;
        const stream = session.promptStreaming(reducePrompt, {
          signal: options?.signal,
        });
        return streamToChunks(stream, onChunk);
      },
    });

    return cleanModelOutput(result) || draft;
  } catch (error) {
    logger.error("Map-reduce optimization failed", error);
    if (!isAbortError(error)) clearSessionCache();
    if (error instanceof PromptTunerError) throw error;
    throw new PromptTunerError(
      error instanceof Error ? error.message : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED",
    );
  }
}

// =============================================================================
// Phase 4 — Writer / Rewriter engine routing
// =============================================================================

function isWriterAvailable(): boolean {
  return typeof Writer !== "undefined";
}

function isRewriterAvailable(): boolean {
  return typeof Rewriter !== "undefined";
}

function buildSharedContext(rules: string[]): string {
  if (rules.length === 0) return "Focus on clarity, specificity, and structure.";
  return `Apply these guidelines when relevant:\n${formatRulesForPrompt(rules)}`;
}

export async function optimizeWithWriter(
  draft: string,
  rules: string[],
  onChunk: (chunk: string) => void,
  options?: AIOptimizeOptions,
): Promise<string> {
  if (!isWriterAvailable()) {
    logger.info("Writer API unavailable — falling back to prompt engine");
    return optimizePromptStreaming(draft, rules, onChunk, options);
  }

  try {
    const availability = await Writer.availability();
    if (availability !== "available") {
      logger.info(
        `Writer API not ready (${availability}) — falling back to prompt engine`,
      );
      return await optimizePromptStreaming(draft, rules, onChunk, options);
    }

    options?.signal?.throwIfAborted();
    options?.onStage?.("writing");

    const writer = await Writer.create({
      tone: "neutral",
      format: "plain-text",
      length: "short",
      sharedContext: buildSharedContext(rules),
    });

    try {
      const stream = writer.writeStreaming(draft, { signal: options?.signal });
      const result = await streamToChunks(stream, onChunk);
      return cleanModelOutput(result) || draft;
    } finally {
      try { writer.destroy(); } catch { /* best-effort */ }
    }
  } catch (error) {
    if (isAbortError(error)) throw error;
    logger.warn("Writer API failed — falling back to prompt engine", error);
    return optimizePromptStreaming(draft, rules, onChunk, options);
  }
}

export async function optimizeWithRewriter(
  draft: string,
  rules: string[],
  onChunk: (chunk: string) => void,
  options?: AIOptimizeOptions,
): Promise<string> {
  if (!isRewriterAvailable()) {
    logger.info("Rewriter API unavailable — falling back to prompt engine");
    return optimizePromptStreaming(draft, rules, onChunk, options);
  }

  try {
    const availability = await Rewriter.availability();
    if (availability !== "available") {
      logger.info(
        `Rewriter API not ready (${availability}) — falling back to prompt engine`,
      );
      return await optimizePromptStreaming(draft, rules, onChunk, options);
    }

    options?.signal?.throwIfAborted();
    options?.onStage?.("rewriting");

    const rewriter = await Rewriter.create({
      tone: "as-is",
      format: "as-is",
      length: "as-is",
      sharedContext: buildSharedContext(rules),
    });

    try {
      const stream = rewriter.rewriteStreaming(draft, { signal: options?.signal });
      const result = await streamToChunks(stream, onChunk);
      return cleanModelOutput(result) || draft;
    } finally {
      try { rewriter.destroy(); } catch { /* best-effort */ }
    }
  } catch (error) {
    if (isAbortError(error)) throw error;
    logger.warn("Rewriter API failed — falling back to prompt engine", error);
    return optimizePromptStreaming(draft, rules, onChunk, options);
  }
}

// =============================================================================
// Phase 5 — Recursive decomposition
// =============================================================================

const PHASE_ARRAY_SCHEMA = {
  type: "array",
  items: { type: "string" },
} as const;

function extractStringArray(raw: string): string[] {
  const trimmed = raw.trim();
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((p): p is string => typeof p === "string")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } catch {
    // Fall through to line-parse below.
  }
  return trimmed
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);
}

export async function optimizeWithDecomposition(
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

  try {
    const session = await getSessionForRules(rules, options);
    options?.signal?.throwIfAborted();

    options?.onStage?.("planning");

    const composed = await recursiveDecompose<string>({
      rootPrompt: draft,
      depth: 2,
      signal: options?.signal,
      expand: async (parent, currentDepth) => {
        options?.signal?.throwIfAborted();
        const query =
          currentDepth === 1
            ? `Task: ${parent}\n\nWhat are the 3-5 top-level phases of this task? Return a JSON array of short strings.`
            : `Phase: ${parent}\n\nExpand this phase into 2-4 concrete steps. Return a JSON array of short strings.`;
        let raw: string;
        try {
          raw = await session.prompt(query, {
            signal: options?.signal,
            responseConstraint: PHASE_ARRAY_SCHEMA,
          });
        } catch {
          // responseConstraint unsupported — retry unconstrained.
          raw = await session.prompt(query, { signal: options?.signal });
        }
        return extractStringArray(raw);
      },
      compose: (parent, children) => {
        const lines: string[] = [`Task: ${parent}`, ""];
        children.forEach(({ node, expanded }, i) => {
          lines.push(`${String(i + 1)}. ${node}`);
          if (expanded) {
            expanded.forEach((step, j) => {
              lines.push(`   ${String(i + 1)}.${String(j + 1)} ${step}`);
            });
          }
        });
        return lines.join("\n");
      },
    });

    // Stream the composed markdown back to give the UI a "streaming" feel.
    options?.onStage?.("composing");
    const lines = composed.split("\n");
    for (const line of lines) {
      options?.signal?.throwIfAborted();
      onChunk(`${line}\n`);
    }
    return composed;
  } catch (error) {
    logger.error("Decomposition optimization failed", error);
    if (!isAbortError(error)) clearSessionCache();
    if (error instanceof PromptTunerError) throw error;
    throw new PromptTunerError(
      error instanceof Error ? error.message : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED",
    );
  }
}

// =============================================================================
// Phase 6 — Hierarchical summarisation fallback
// =============================================================================

function isSummarizerAvailable(): boolean {
  return typeof Summarizer !== "undefined";
}

export async function optimizeWithHierarchical(
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

  if (!isSummarizerAvailable()) {
    throw new PromptTunerError(
      "Input is too long and the Summarizer API is unavailable. Please shorten your prompt.",
      "INPUT_TOO_LONG",
    );
  }

  try {
    const session = await getSessionForRules(rules, options);
    const inputLimit = resolveInputLimit(session);
    options?.signal?.throwIfAborted();

    const summarizerStatus = await Summarizer.availability();
    if (summarizerStatus !== "available") {
      throw new PromptTunerError(
        "Summarizer API not ready. Please shorten your prompt.",
        "INPUT_TOO_LONG",
      );
    }

    options?.onStage?.("shrinking");
    const chunkCap = Math.max(256, Math.floor(inputLimit * MAP_CHUNK_HEADROOM));
    const chunks = await chunkByParagraphs(draft, chunkCap, (s) =>
      measureTokens(session, s),
    );

    const summarizer = await Summarizer.create({
      type: "teaser",
      length: "short",
    });

    let compressed: string;
    try {
      const summaries: string[] = [];
      for (const chunk of chunks) {
        options?.signal?.throwIfAborted();
        const s = await summarizer.summarize(chunk, { signal: options?.signal });
        summaries.push(s);
      }
      compressed = summaries.join("\n\n");
    } finally {
      try { summarizer.destroy(); } catch { /* best-effort */ }
    }

    // After compression, run the normal map-reduce pipeline on the compressed
    // version. If it now fits, mapReduce will collapse to a single call.
    return await optimizeWithMapReduce(compressed, rules, onChunk, options);
  } catch (error) {
    logger.error("Hierarchical optimization failed", error);
    if (!isAbortError(error)) clearSessionCache();
    if (error instanceof PromptTunerError) throw error;
    throw new PromptTunerError(
      error instanceof Error ? error.message : "Failed to generate optimized prompt",
      "AI_GENERATION_FAILED",
    );
  }
}

// Internal helpers for use by decomposition / engine-routing paths.
export const __internal = {
  getSessionForRules,
  streamToChunks,
  cleanModelOutput,
  resolveInputLimit,
  measureTokens,
};
