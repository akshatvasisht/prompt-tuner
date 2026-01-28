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

/** Request payload for prompt optimization */
export interface OptimizeRequest {
  /** The draft prompt to optimize */
  draft: string;
  /** The platform the user is on */
  platform: Platform;
  /** Optional additional context */
  context?: string;
}

/** Response payload from prompt optimization */
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

// =============================================================================
// Zod Schemas for Runtime Validation
// =============================================================================

import { z } from "zod";

/**
 * Schema for a single optimization rule
 * Validates structure of rules fetched from remote sources
 */
export const OptimizationRuleSchema = z.object({
  id: z.string().min(1),
  platform: z.enum(["openai", "anthropic", "google"]),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  rule: z.string().min(10), // Rules must be substantial
  examples: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  createdAt: z.string().optional(),
});

/**
 * Schema for an array of optimization rules
 */
export const OptimizationRulesArraySchema = z.array(OptimizationRuleSchema);

/**
 * Schema for cached rules with metadata
 */
export const CachedRulesSchema = z.object({
  rules: OptimizationRulesArraySchema,
  fetchedAt: z.number(), // Timestamp
  source: z.enum(["bundled", "remote"]),
  version: z.string().optional(),
});

/**
 * Type inference from schemas
 */
export type ValidatedOptimizationRule = z.infer<typeof OptimizationRuleSchema>;
export type ValidatedRulesArray = z.infer<typeof OptimizationRulesArraySchema>;
export type CachedRules = z.infer<typeof CachedRulesSchema>;
