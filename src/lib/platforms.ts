import { type Platform } from "~types";

/**
 * Platform URL patterns for detection
 */
export const PLATFORM_PATTERNS: Record<Exclude<Platform, "unknown">, string[]> = {
    openai: ["chat.openai.com", "chatgpt.com"],
    anthropic: ["claude.ai", "anthropic.com"],
    google: ["bard.google.com", "gemini.google.com"],
};

/**
 * Platform display names
 */
export const PLATFORM_DISPLAY_NAMES: Record<Platform, string> = {
    openai: "ChatGPT",
    anthropic: "Claude",
    google: "Gemini",
    unknown: "Unknown",
};

/**
 * Platform-specific input selectors for prompt areas
 */
export const PLATFORM_INPUT_SELECTORS: Record<Platform, string[]> = {
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
