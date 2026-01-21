/**
 * Shared TypeScript types for Prompt Tuner
 */

// =============================================================================
// Platform Types
// =============================================================================

/** Supported LLM platforms */
export type Platform = "openai" | "anthropic" | "google" | "unknown"

/** Platforms that have optimization rules */
export type SupportedPlatform = Exclude<Platform, "unknown">

// =============================================================================
// Rule Types
// =============================================================================

/** A single optimization rule stored in the vector database */
export interface OptimizationRule {
  /** Unique identifier for the rule */
  id: string
  /** Platform this rule applies to */
  platform: SupportedPlatform
  /** The rule text/instruction */
  rule: string
  /** Optional title for the rule */
  title?: string
  /** Optional description */
  description?: string
  /** Tags for categorization */
  tags?: string[]
  /** Source URL of the rule */
  source?: string
  /** When the rule was created */
  createdAt?: string
}

/** Result from vector database search */
export interface VectorSearchResult {
  /** The matched rule */
  rule: OptimizationRule
  /** Relevance score (0-1) */
  score: number
}

// =============================================================================
// Message Types (Plasmo Messaging)
// =============================================================================

/** Request payload for prompt optimization */
export interface OptimizeRequest {
  /** The draft prompt to optimize */
  draft: string
  /** The platform the user is on */
  platform: Platform
  /** Optional additional context */
  context?: string
}

/** Response payload from prompt optimization */
export interface OptimizeResponse {
  /** Whether the optimization was successful */
  success: boolean
  /** The optimized prompt (or original if failed) */
  optimizedPrompt: string
  /** Rules that were applied */
  appliedRules: string[]
  /** Error information if failed */
  error?: {
    code: ErrorCode
    message: string
  }
}

// =============================================================================
// Error Types
// =============================================================================

/** Error codes for the extension */
export type ErrorCode =
  | "AI_UNAVAILABLE"
  | "AI_SESSION_FAILED"
  | "AI_GENERATION_FAILED"
  | "INVALID_REQUEST"
  | "ELEMENT_NOT_FOUND"
  | "PLATFORM_UNSUPPORTED"
  | "DATABASE_ERROR"
  | "UNKNOWN_ERROR"

/** Custom error class for extension errors */
export class PromptTunerError extends Error {
  code: ErrorCode

  constructor(message: string, code: ErrorCode) {
    super(message)
    this.name = "PromptTunerError"
    this.code = code
  }
}

// =============================================================================
// AI Engine Types
// =============================================================================

/** AI availability status */
export interface AIAvailability {
  /** Whether AI is available */
  available: boolean
  /** Reason if not available */
  reason?: string
  /** Whether download is needed */
  needsDownload?: boolean
}

/** Options for AI optimization */
export interface AIOptimizeOptions {
  /** Temperature for generation (0-1) */
  temperature?: number
  /** Maximum tokens to generate */
  maxTokens?: number
}

// =============================================================================
// Storage Types
// =============================================================================

/** Extension settings stored in chrome.storage */
export interface ExtensionSettings {
  /** Whether the extension is enabled */
  enabled: boolean
  /** Whether to show the sparkle widget */
  showWidget: boolean
  /** Last update timestamp for rules */
  rulesLastUpdated?: number
}

/** Default settings */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  showWidget: true,
}

// =============================================================================
// DOM Types
// =============================================================================

/** Result of a text replacement operation */
export interface ReplaceTextResult {
  success: boolean
  error?: string
}

/** Valid text input element types */
export type TextInputElement = HTMLTextAreaElement | HTMLDivElement
