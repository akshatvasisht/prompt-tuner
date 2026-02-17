/**
 * Platform detection utilities
 * Identifies which LLM platform the user is currently using
 */

import { type Platform } from "~types";

import {
  PLATFORM_PATTERNS,
  PLATFORM_DISPLAY_NAMES,
  PLATFORM_INPUT_SELECTORS,
} from "~lib/platforms";

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
  return PLATFORM_DISPLAY_NAMES[platform];
}

/**
 * Get platform-specific input selectors
 */
export function getPlatformInputSelectors(platform: Platform): string[] {
  return PLATFORM_INPUT_SELECTORS[platform];
}
