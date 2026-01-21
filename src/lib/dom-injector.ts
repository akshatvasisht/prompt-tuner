/**
 * DOM Injector - Safe text replacement for LLM platform inputs
 *
 * Handles both textarea and contenteditable elements with proper
 * event dispatching to ensure React/Vue frameworks detect changes.
 */

import { type ReplaceTextResult, type TextInputElement } from "~types"

/**
 * Checks if an element is currently in the DOM and editable
 */
export function isElementValid(element: HTMLElement | null): element is TextInputElement {
  if (!element) return false
  if (!document.body.contains(element)) return false

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly
  }

  if (element instanceof HTMLDivElement) {
    return element.contentEditable === "true" && !element.ariaReadOnly
  }

  return false
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
  })
  return element.dispatchEvent(beforeInputEvent)
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
  })
  element.dispatchEvent(inputEvent)
}

/**
 * Dispatches change event for framework compatibility
 */
function dispatchChangeEvent(element: HTMLElement): void {
  const changeEvent = new Event("change", {
    bubbles: true,
    cancelable: false,
  })
  element.dispatchEvent(changeEvent)
}

/**
 * Replaces text in a textarea using the native value setter
 * This preserves React's synthetic event system compatibility
 */
function replaceTextarea(element: HTMLTextAreaElement, newText: string): ReplaceTextResult {
  try {
    // Dispatch beforeinput BEFORE mutation
    const shouldContinue = dispatchBeforeInput(element, newText)
    if (!shouldContinue) {
      return { success: false, error: "beforeinput event was cancelled" }
    }

    // Use native setter to bypass React's value tracking
    const descriptor = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )

    if (descriptor?.set) {
      descriptor.set.call(element, newText)
    } else {
      element.value = newText
    }

    // Dispatch input event AFTER mutation
    dispatchInputEvent(element, newText)
    dispatchChangeEvent(element)

    // Set cursor to end of text
    element.setSelectionRange(newText.length, newText.length)
    element.focus()

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Replaces text in a contenteditable element using execCommand
 * This preserves editor state (undo/redo history) for rich text editors
 */
function replaceContentEditable(element: HTMLDivElement, newText: string): ReplaceTextResult {
  try {
    // Ensure element has focus for execCommand to work
    element.focus()

    const selection = window.getSelection()
    if (!selection) {
      return { success: false, error: "No selection available" }
    }

    // Dispatch beforeinput BEFORE mutation
    const shouldContinue = dispatchBeforeInput(element, newText)
    if (!shouldContinue) {
      return { success: false, error: "beforeinput event was cancelled" }
    }

    // Select all content in the element
    const range = document.createRange()
    range.selectNodeContents(element)
    selection.removeAllRanges()
    selection.addRange(range)

    // Try execCommand first - preserves editor state and undo history
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const execCommandSuccess = document.execCommand("insertText", false, newText)

    if (execCommandSuccess) {
      dispatchChangeEvent(element)
      return { success: true }
    }

    // Fallback: Use Input Events Level 2 API
    const dataTransfer = new DataTransfer()
    dataTransfer.setData("text/plain", newText)

    const insertEvent = new InputEvent("input", {
      bubbles: true,
      cancelable: false,
      inputType: "insertReplacementText",
      data: newText,
      dataTransfer,
    })

    // Clear and set content
    element.textContent = newText
    element.dispatchEvent(insertEvent)
    dispatchChangeEvent(element)

    // Set cursor to end
    range.selectNodeContents(element)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Replaces text in a textarea or contenteditable element
 *
 * @param element - The textarea or contenteditable element to update
 * @param newText - The new text content to set
 * @returns Result indicating success or failure
 */
export function replaceText(
  element: TextInputElement | null,
  newText: string
): ReplaceTextResult {
  if (!isElementValid(element)) {
    return { success: false, error: "Element is not valid or not in DOM" }
  }

  if (element instanceof HTMLTextAreaElement) {
    return replaceTextarea(element, newText)
  }

  if (element instanceof HTMLDivElement && element.contentEditable === "true") {
    return replaceContentEditable(element, newText)
  }

  return { success: false, error: "Unsupported element type" }
}

/**
 * Gets the currently active text input element
 */
export function getActiveTextInput(): TextInputElement | null {
  const activeElement = document.activeElement

  if (!activeElement) {
    return null
  }

  if (activeElement instanceof HTMLTextAreaElement) {
    return activeElement
  }

  if (activeElement instanceof HTMLDivElement && activeElement.contentEditable === "true") {
    return activeElement
  }

  // Fallback: search for common selectors
  const selectors = [
    'textarea[placeholder*="Message"]',
    'textarea[data-id="root"]',
    "textarea#prompt-textarea",
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"].ProseMirror',
  ]

  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element instanceof HTMLTextAreaElement) {
      return element
    }
    if (element instanceof HTMLDivElement && element.contentEditable === "true") {
      return element
    }
  }

  return null
}

/**
 * Gets the text content from a text input element
 */
export function getElementText(element: TextInputElement): string {
  if (element instanceof HTMLTextAreaElement) {
    return element.value
  }
  // textContent can be null for some node types
  return element.textContent || element.innerText || ""
}
