/**
 * Platform detection utilities
 * Identifies which LLM platform the user is currently using
 */

import { type Platform } from "~types";

/** Platform URL patterns for detection */
const PLATFORM_PATTERNS: Record<Exclude<Platform, "unknown">, string[]> = {
  openai: ["chat.openai.com", "chatgpt.com"],
  anthropic: ["claude.ai", "anthropic.com"],
  google: ["bard.google.com", "gemini.google.com"],
};

/**
 * Detect the current platform based on URL
 */
export function detectPlatform(): Platform {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const hostname = window.location.hostname.toLowerCase();

  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (patterns.some((pattern) => hostname.includes(pattern))) {
      return platform as Platform;
    }
  }

  return "unknown";
}

/**
 * Check if the current page is a supported LLM platform
 */
export function isSupportedPlatform(): boolean {
  return detectPlatform() !== "unknown";
}

/**
 * Get the display name for a platform
 */
export function getPlatformDisplayName(platform: Platform): string {
  const names: Record<Platform, string> = {
    openai: "ChatGPT",
    anthropic: "Claude",
    google: "Gemini",
    unknown: "Unknown",
  };
  return names[platform];
}

/**
 * Get platform-specific input selectors
 */
export function getPlatformInputSelectors(platform: Platform): string[] {
  const selectors: Record<Platform, string[]> = {
    openai: [
      'textarea[data-id="root"]',
      "#prompt-textarea",
      'textarea[placeholder*="Message"]',
      'div[contenteditable="true"][data-placeholder]',
    ],
    anthropic: [
      'div[contenteditable="true"].ProseMirror',
      'div[contenteditable="true"][role="textbox"]',
      'fieldset div[contenteditable="true"]',
    ],
    google: [
      'textarea[aria-label*="prompt"]',
      'div[contenteditable="true"][role="textbox"]',
      ".ql-editor",
    ],
    unknown: ["textarea", 'div[contenteditable="true"]', 'input[type="text"]'],
  };
  return selectors[platform];
}
