/**
 * System-wide constants for Prompt Tuner
 * Single source of truth for strings, IDs, and infrastructure names.
 */

export const PORT_NAMES = {
  OPTIMIZE: "optimize-port",
} as const;

export const COMMAND_IDS = {
  TOGGLE_OVERLAY: "toggle-overlay",
} as const;

export const STORAGE_KEYS = {
  INSTALLED_AT: "installedAt",
  LAST_UPDATED: "lastUpdated",
  VERSION: "version",
  SETTINGS: "settings",
  RULES_CACHE_PREFIX: "rules_cache_",
  DEFAULT_ACTION: "settings.defaultAction",
  RUN_ON_OPEN: "settings.runOnOpen",
} as const;

export const CONFIG = {
  GITHUB_PAGES_BASE_URL: "https://akshatvasisht.github.io/prompt-tuner/",
  CACHE_DURATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

export const ALARM_NAMES = {
  KEEP_ALIVE: "prompt-tuner-keep-alive",
} as const;

export const KEYBOARD_SHORTCUTS = {
  TOGGLE_OVERLAY: "Mod+Shift+K",
} as const;

export const MESSAGE_TYPES = {
  TOGGLE_OVERLAY: "TOGGLE_OVERLAY",
  START_OPTIMIZATION: "START_OPTIMIZATION",
  REPLACE_TEXT: "REPLACE_TEXT",
  REPLACE_TEXT_RESPONSE: "REPLACE_TEXT_RESPONSE",
  REFRESH_RULES: "REFRESH_RULES",
  PING: "PING",
  PONG: "PONG",
} as const;

/**
 * Mapping from ErrorCode to user-facing plain-language messages.
 * Raw error codes are never shown to the user.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  AI_UNAVAILABLE:
    "Gemini Nano isn't available. Make sure Chrome 138+ is installed and the model is downloaded.",
  AI_SESSION_FAILED:
    "Couldn't start an AI session. Try closing and reopening the overlay.",
  AI_GENERATION_FAILED:
    "The model ran into a problem generating a response. Try again.",
  INPUT_TOO_LONG:
    "Your selected text is too long for the model. Select a shorter passage.",
  INVALID_REQUEST:
    "Something went wrong with the request format. Please try again.",
  UNKNOWN_ERROR:
    "Something unexpected went wrong. Try again or reload the page.",
};

export const MESSAGE_SOURCES = {
  PROMPT_TUNER: "prompt-tuner",
} as const;

export const DOM_SELECTORS = {
  INPUTS: [
    'textarea[placeholder*="Message"]',
    'textarea[data-id="root"]',
    "textarea#prompt-textarea",
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"].ProseMirror',
  ],
} as const;

export const WIDGET_IDS = {
  TRIGGER_BUTTON: "trigger-button",
  OVERLAY_CONTAINER: "prompt-tuner-container",
} as const;
