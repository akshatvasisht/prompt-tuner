/**
 * Main World Injector Script
 *
 * Runs in the MAIN world (page context) instead of ISOLATED world (extension context).
 * This allows direct DOM manipulation that React/Vue cannot block or ignore.
 *
 * Why Main World Execution?
 * - React/Vue use Virtual DOM and may ignore InputEvents from Isolated World
 * - Main World scripts can directly manipulate the actual DOM and internal state
 * - Essential for reliability on React-heavy sites like ChatGPT and Claude
 *
 * Communication:
 * - Receives messages from content script via window.postMessage
 * - Performs text replacement in page context
 * - Sends success/failure responses back to content script
 *
 * Security:
 * - Only processes messages from extension origin
 * - Validates all inputs before DOM manipulation
 * - No eval() or dynamic code execution
 */

import type { PlasmoCSConfig } from "plasmo";

// =============================================================================
// Configuration
// =============================================================================

export const config: PlasmoCSConfig = {
  matches: [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://bard.google.com/*",
    "https://gemini.google.com/*",
  ],
  world: "MAIN",
};

// =============================================================================
// Constants
// =============================================================================

const MESSAGE_SOURCE = "prompt-tuner";
const MESSAGE_TYPE_REPLACE = "REPLACE_TEXT";
const MESSAGE_TYPE_RESPONSE = "REPLACE_TEXT_RESPONSE";

// =============================================================================
// Types
// =============================================================================

interface ReplaceTextMessage {
  type: typeof MESSAGE_TYPE_REPLACE;
  source: typeof MESSAGE_SOURCE;
  id: string;
  selector?: string;
  element?: string; // Serialized element identifier
  text: string;
}

interface ReplaceTextResponse {
  type: typeof MESSAGE_TYPE_RESPONSE;
  source: typeof MESSAGE_SOURCE;
  id: string;
  success: boolean;
  error?: string;
}

// =============================================================================
// DOM Manipulation (Main World)
// =============================================================================

/**
 * Finds a text input element by selector or active element
 */
function findTextInputElement(selector?: string): HTMLElement | null {
  if (selector) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      return element;
    }
  }

  // Fallback: use document.activeElement
  const active = document.activeElement;
  if (
    active instanceof HTMLTextAreaElement ||
    (active instanceof HTMLDivElement && active.contentEditable === "true")
  ) {
    return active;
  }

  return null;
}

/**
 * Replaces text in a textarea using native setters (Main World)
 */
function replaceTextarea(
  element: HTMLTextAreaElement,
  newText: string,
): { success: boolean; error?: string } {
  try {
    // Get native property descriptor
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    );

    if (descriptor?.set) {
      // Call native setter directly (bypasses React tracking)
      descriptor.set.call(element, newText);
    } else {
      element.value = newText;
    }

    // Dispatch events that React/frameworks listen to
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));

    // Set cursor to end
    element.setSelectionRange(newText.length, newText.length);
    element.focus();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Replaces text in a contenteditable div (Main World)
 */
function replaceContentEditable(
  element: HTMLDivElement,
  newText: string,
): { success: boolean; error?: string } {
  try {
    element.focus();

    const selection = window.getSelection();
    if (!selection) {
      return { success: false, error: "No selection available" };
    }

    // Select all content
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);

    // Try execCommand first (preserves undo history)
    const success = document.execCommand("insertText", false, newText);

    if (success) {
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return { success: true };
    }

    // Fallback: direct manipulation
    element.textContent = newText;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));

    // Set cursor to end
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Main text replacement function (Main World context)
 */
function replaceText(
  selector: string | undefined,
  newText: string,
): { success: boolean; error?: string } {
  const element = findTextInputElement(selector);

  if (!element) {
    return { success: false, error: "Element not found or not in DOM" };
  }

  if (element instanceof HTMLTextAreaElement) {
    return replaceTextarea(element, newText);
  }

  if (element instanceof HTMLDivElement && element.contentEditable === "true") {
    return replaceContentEditable(element, newText);
  }

  return { success: false, error: "Unsupported element type" };
}

// =============================================================================
// Message Handler
// =============================================================================

/**
 * Validates incoming message
 */
function isReplaceTextMessage(data: unknown): data is ReplaceTextMessage {
  if (!data || typeof data !== "object") return false;

  const msg = data as Record<string, unknown>;

  return (
    msg.type === MESSAGE_TYPE_REPLACE &&
    msg.source === MESSAGE_SOURCE &&
    typeof msg.id === "string" &&
    typeof msg.text === "string"
  );
}

/**
 * Main message handler - listens for messages from content script
 */
function handleMessage(event: MessageEvent): void {
  // Security: Only process messages from same origin
  if (event.origin !== window.location.origin) {
    return;
  }

  // Validate message format
  if (!isReplaceTextMessage(event.data)) {
    return;
  }

  const message = event.data;

  // Perform text replacement in Main World
  const result = replaceText(message.selector, message.text);

  // Send response back to content script
  const response: ReplaceTextResponse = {
    type: MESSAGE_TYPE_RESPONSE,
    source: MESSAGE_SOURCE,
    id: message.id,
    success: result.success,
    error: result.error,
  };

  window.postMessage(response, window.location.origin);
}

// =============================================================================
// Initialization
// =============================================================================

// Register message listener
window.addEventListener("message", handleMessage, false);

// Signal that Main World injector is ready
window.postMessage(
  {
    type: "PROMPT_TUNER_READY",
    source: MESSAGE_SOURCE,
  },
  window.location.origin,
);
