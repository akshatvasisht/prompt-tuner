/**
 * Shared TypeScript types for Prompt Tuner
 */

// =============================================================================
// Platform Types
// =============================================================================

/** Supported LLM platforms */
export type Platform = "openai" | "anthropic" | "google" | "unknown";

/** Platforms that have optimization rules */
export type SupportedPlatform = Exclude<Platform, "unknown">;

// =============================================================================
// Rule Types
// =============================================================================

/** A single optimization rule for prompt engineering */
export interface OptimizationRule {
  /** Unique identifier for the rule */
  id: string;
  /** Platform this rule applies to */
  platform: SupportedPlatform;
  /** The rule text/instruction */
  rule: string;
  /** Optional title for the rule */
  title?: string;
  /** Optional description */
  description?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Source URL of the rule */
  source?: string;
  /** When the rule was created */
  createdAt?: string;
}

// =============================================================================
// Message Types (Plasmo Messaging)
// =============================================================================

/** Base interface for all messages */
export interface BaseMessage {
  type: string;
}

/** Toggles the main overlay UI */
export interface ToggleOverlayMessage extends BaseMessage {
  type: "TOGGLE_OVERLAY";
}

/** Legacy status checks (kept for background consistency) */
export interface StatusCheckMessage extends BaseMessage {
  type: "PING" | "CHECK_STATUS" | "CHECK_DB_STATUS";
}

/** Request payload for prompt optimization */
export interface OptimizeRequest {
  draft: string;
  platform: Platform;
  context?: string;
}

/** Message to start optimization from the overlay */
export interface StartOptimizationMessage extends BaseMessage {
  type: "START_OPTIMIZATION";
  payload: OptimizeRequest;
}

/** Union of all possible extension messages */
export type ExtensionMessage =
  | ToggleOverlayMessage
  | StatusCheckMessage
  | StartOptimizationMessage;

// =============================================================================
// Port-based Streaming Types (optimize-port)
// =============================================================================

/** Request message sent from overlay to background over port */
export interface OptimizePortRequest {
  type: "START_OPTIMIZATION";
  draft: string;
  platform: Platform;
  action: string;
}

/** Cancel message sent from overlay to background over port */
export interface OptimizePortCancel {
  type: "CANCEL";
}

/** Stage progress message sent from background to overlay */
export interface OptimizePortStage {
  type: "STAGE";
  stage: string;
}

/** Streaming chunk message sent from background to overlay */
export interface OptimizePortChunk {
  type: "CHUNK";
  data: string;
}

/** Final completion message sent from background to overlay */
export interface OptimizePortComplete {
  type: "COMPLETE";
  optimizedPrompt: string;
  appliedRules: string[];
}

/** Error message sent from background to overlay */
export interface OptimizePortError {
  type: "ERROR";
  code: ErrorCode;
  message: string;
}

/** Token usage info sent from background to overlay before streaming starts */
export interface OptimizePortTokenInfo {
  type: "TOKEN_INFO";
  count: number;
  limit: number;
}

/** Union of all possible messages sent OVER the optimize-port */
export type OptimizePortMessage =
  | OptimizePortRequest
  | OptimizePortCancel
  | OptimizePortChunk
  | OptimizePortComplete
  | OptimizePortError
  | OptimizePortTokenInfo
  | OptimizePortStage;

/** Response payload from single-fire prompt optimization (legacy/fallback) */
export interface OptimizeResponse {
  /** Whether the optimization was successful */
  success: boolean;
  /** The optimized prompt (or original if failed) */
  optimizedPrompt: string;
  /** Rules that were applied */
  appliedRules: string[];
  /** Error information if failed */
  error?: {
    code: ErrorCode;
    message: string;
  };
}

// =============================================================================
// Error Types
// =============================================================================

/** Error codes for the extension */
export type ErrorCode =
  | "AI_UNAVAILABLE"
  | "AI_SESSION_FAILED"
  | "AI_GENERATION_FAILED"
  | "INPUT_TOO_LONG"
  | "INVALID_REQUEST"
  | "ELEMENT_NOT_FOUND"
  | "PLATFORM_UNSUPPORTED"
  | "UNKNOWN_ERROR";

/** Custom error class for extension errors */
export class PromptTunerError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = "PromptTunerError";
    this.code = code;
  }
}

// =============================================================================
// AI Engine Types
// =============================================================================

/** AI availability status */
export interface AIAvailability {
  /** Whether AI is available */
  available: boolean;
  /** Reason if not available */
  reason?: string;
  /** Whether download is needed */
  needsDownload?: boolean;
}

/** Options for AI optimization */
export interface AIOptimizeOptions {
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Called with token count before streaming starts (count=0 if unavailable) */
  onTokenCount?: (count: number, limit: number) => void;
  /** Called with a stage label before each stage of a multi-stage pipeline */
  onStage?: (stage: string) => void;
  /** Abort signal for cancelling an in-flight optimization */
  signal?: AbortSignal;
}

// =============================================================================
// Storage Types
// =============================================================================

/** Extension settings stored in chrome.storage */
export interface ExtensionSettings {
  /** Whether the extension is enabled */
  enabled: boolean;
  /** Whether to show the sparkle widget */
  showWidget: boolean;
  /** Last update timestamp for rules */
  rulesLastUpdated?: number;
  /** Default action to run on open (action ID) */
  defaultAction?: string;
  /** Whether to skip the palette and run the default action immediately */
  runOnOpen?: boolean;
}

/** Default settings */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  showWidget: true,
};

// =============================================================================
// DOM Types
// =============================================================================

/** Result of a text replacement operation */
export interface ReplaceTextResult {
  success: boolean;
  error?: string;
}

/** Valid text input element types */
export type TextInputElement = HTMLTextAreaElement | HTMLDivElement;
