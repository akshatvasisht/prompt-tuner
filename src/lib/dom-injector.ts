/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * DOM Injector - Safe text replacement for LLM platform inputs
 *
 * Features:
 * - Main World Bridge: Tries injection via Main World script first (better React compat)
 * - Isolated World Fallback: Falls back to content script injection if Main World unavailable
 * - Proper event dispatching to ensure React/Vue frameworks detect changes
 *
 * Architecture:
 * 1. Primary: Send message to Main World injector (runs in page context)
 * 2. Fallback: Direct manipulation from Isolated World (content script context)
 */

import { type ReplaceTextResult, type TextInputElement } from "~types";

// =============================================================================
// Main World Bridge
// =============================================================================

import { MESSAGE_SOURCES, MESSAGE_TYPES, DOM_SELECTORS } from "~lib/constants";

const MAIN_WORLD_TIMEOUT = 1000; // 1 second timeout for Main World response
const MESSAGE_SOURCE = MESSAGE_SOURCES.PROMPT_TUNER;

interface MainWorldResponse {
  type: typeof MESSAGE_TYPES.REPLACE_TEXT_RESPONSE;
  source: typeof MESSAGE_SOURCE;
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Generates a unique CSS selector for an element
 */
function getElementSelector(element: HTMLElement): string | undefined {
  // Try ID first
  if (element.id) {
    return `#${element.id}`;
  }

  // Try common data attributes
  const dataId = element.getAttribute("data-id");
  if (dataId) {
    return `[data-id="${dataId}"]`;
  }

  // Try class + tag combination
  if (element.className && typeof element.className === "string") {
    const classes = element.className.trim().split(/\s+/).slice(0, 2).join(".");
    if (classes) {
      const selector = `${element.tagName.toLowerCase()}.${classes}`;
      // Verify uniqueness
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }
  }

  return undefined;
}

/**
 * Attempts text replacement via Main World injector
 * Returns null if Main World is unavailable, otherwise returns result
 */
async function tryMainWorldReplacement(
  element: TextInputElement,
  newText: string,
): Promise<ReplaceTextResult | null> {
  try {
    const messageId = `replace-${String(Date.now())}-${Math.random().toString(36).slice(2)}`;
    const selector = getElementSelector(element);

    // Send message to Main World
    const message = {
      type: MESSAGE_TYPES.REPLACE_TEXT,
      source: MESSAGE_SOURCE,
      id: messageId,
      selector,
      text: newText,
    };

    // Listen for response
    const responsePromise = new Promise<MainWorldResponse>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Main World injection timeout"));
        }, MAIN_WORLD_TIMEOUT);

        const handler = (event: MessageEvent): void => {
          const data = event.data as Record<string, unknown>;
          if (
            event.source === window &&
            data.type === MESSAGE_TYPES.REPLACE_TEXT_RESPONSE &&
            data.source === MESSAGE_SOURCE &&
            data.id === messageId
          ) {
            clearTimeout(timeout);
            window.removeEventListener("message", handler);
            resolve(data as unknown as MainWorldResponse);
          }
        };

        window.addEventListener("message", handler);
      },
    );

    // Send the message
    window.postMessage(message, window.location.origin);

    // Wait for response
    const response = await responsePromise;

    return {
      success: response.success,
      error: response.error,
    };
  } catch {
    // Main World unavailable or timed out - will fallback to Isolated World
    return null;
  }
}

// =============================================================================
// Isolated World Injection (Fallback)
// =============================================================================

/**
 * Checks if an element is currently in the DOM and editable
 */
export function isElementValid(
  element: HTMLElement | null,
): element is TextInputElement {
  if (!element) return false;
  if (!document.body.contains(element)) return false;

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly;
  }

  if (element instanceof HTMLDivElement) {
    return element.contentEditable === "true" && !element.ariaReadOnly;
  }

  return false;
}

/**
 * Dispatches beforeinput event (must be called BEFORE DOM mutation)
 * Returns false if the event was cancelled
 */
function dispatchBeforeInput(element: HTMLElement, newText: string): boolean {
  const beforeInputEvent = new InputEvent("beforeinput", {
    bubbles: true,
    cancelable: true,
    inputType: "insertReplacementText",
    data: newText,
  });
  return element.dispatchEvent(beforeInputEvent);
}

/**
 * Dispatches input event (must be called AFTER DOM mutation)
 */
function dispatchInputEvent(element: HTMLElement, newText: string): void {
  const inputEvent = new InputEvent("input", {
    bubbles: true,
    cancelable: false,
    inputType: "insertReplacementText",
    data: newText,
  });
  element.dispatchEvent(inputEvent);
}

/**
 * Dispatches change event for framework compatibility
 */
function dispatchChangeEvent(element: HTMLElement): void {
  const changeEvent = new Event("change", {
    bubbles: true,
    cancelable: false,
  });
  element.dispatchEvent(changeEvent);
}

/**
 * Replaces text in a textarea using the native value setter
 * This preserves React's synthetic event system compatibility
 */
function replaceTextarea(
  element: HTMLTextAreaElement,
  newText: string,
): ReplaceTextResult {
  try {
    // Dispatch beforeinput BEFORE mutation
    const shouldContinue = dispatchBeforeInput(element, newText);
    if (!shouldContinue) {
      return { success: false, error: "beforeinput event was cancelled" };
    }

    // Use native setter to bypass React's value tracking
    const descriptor = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    );

    if (descriptor?.set) {
      descriptor.set.call(element, newText);
    } else {
      element.value = newText;
    }

    // Dispatch input event AFTER mutation
    dispatchInputEvent(element, newText);
    dispatchChangeEvent(element);

    // Set cursor to end of text
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
 * Replaces text in a contenteditable element using execCommand
 * This preserves editor state (undo/redo history) for rich text editors
 */
function replaceContentEditable(
  element: HTMLDivElement,
  newText: string,
): ReplaceTextResult {
  try {
    // Ensure element has focus for execCommand to work
    element.focus();

    const selection = window.getSelection();
    if (!selection) {
      return { success: false, error: "No selection available" };
    }

    // Dispatch beforeinput BEFORE mutation
    const shouldContinue = dispatchBeforeInput(element, newText);
    if (!shouldContinue) {
      return { success: false, error: "beforeinput event was cancelled" };
    }

    // Select all content in the element
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);

    // Try execCommand first - preserves editor state and undo history
    const execCommandSuccess = document.execCommand(
      "insertText",
      false,
      newText,
    );

    if (execCommandSuccess) {
      dispatchChangeEvent(element);
      return { success: true };
    }

    // Fallback: Use Input Events Level 2 API
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", newText);

    const insertEvent = new InputEvent("input", {
      bubbles: true,
      cancelable: false,
      inputType: "insertReplacementText",
      data: newText,
      dataTransfer,
    });

    // Clear and set content
    element.textContent = newText;
    element.dispatchEvent(insertEvent);
    dispatchChangeEvent(element);

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
 * Replaces text in a textarea or contenteditable element using Isolated World
 * This is the fallback when Main World injection is unavailable
 */

/**
 * Replaces text in a textarea or contenteditable element
 *
 * Strategy:
 * 1. Try Main World injection first (better compatibility with React/Vue)
 * 2. Fallback to Isolated World injection if Main World unavailable
 *
 * @param element - The textarea or contenteditable element to update
 * @param newText - The new text content to set
 * @returns Result indicating success or failure
 */
export async function replaceText(
  element: TextInputElement | null,
  newText: string,
): Promise<ReplaceTextResult> {
  if (!isElementValid(element)) {
    return { success: false, error: "Element is not valid or not in DOM" };
  }

  // Try Main World injection first
  const mainWorldResult = await tryMainWorldReplacement(element, newText);

  if (mainWorldResult !== null) {
    // Main World injection attempted - return its result (success or failure)
    return mainWorldResult;
  }

  // Fallback: Use Isolated World injection
  if (element instanceof HTMLTextAreaElement) {
    return replaceTextarea(element, newText);
  }

  if (element instanceof HTMLDivElement && element.contentEditable === "true") {
    return replaceContentEditable(element, newText);
  }

  return { success: false, error: "Unsupported element type" };
}

/**
 * Gets the currently active text input element
 */
export function getActiveTextInput(): TextInputElement | null {
  const activeElement = document.activeElement;

  if (!activeElement) {
    return null;
  }

  if (activeElement instanceof HTMLTextAreaElement) {
    return activeElement;
  }

  if (
    activeElement instanceof HTMLDivElement &&
    activeElement.contentEditable === "true"
  ) {
    return activeElement;
  }

  // Fallback: search for common selectors
  const selectors = DOM_SELECTORS.INPUTS;

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLTextAreaElement) {
      return element;
    }
    if (
      element instanceof HTMLDivElement &&
      element.contentEditable === "true"
    ) {
      return element;
    }
  }

  return null;
}

/**
 * Gets the text content from a text input element
 */
export function getElementText(element: TextInputElement): string {
  if (element instanceof HTMLTextAreaElement) {
    return element.value;
  }
  // textContent can be null for some node types
  return element.textContent || element.innerText || "";
}
