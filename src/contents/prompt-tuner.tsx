/**
 * Content Script Entry Point
 *
 * Injects the Sparkle Widget into LLM platform pages (ChatGPT, Claude, Gemini)
 *
 * Features:
 * - Focus tracking for text inputs
 * - MutationObserver for element removal detection
 * - SPA navigation handling
 * - Proper cleanup on unmount
 */

import { createRoot, type Root } from "react-dom/client"
import { SparkleWidget } from "~components/sparkle-widget"
import { getActiveTextInput } from "~lib/dom-injector"
import { isSupportedPlatform } from "~lib/platform-detector"
import { throttle } from "~lib/utils"
import { type TextInputElement } from "~types"

// =============================================================================
// State Management
// =============================================================================

let widgetRoot: Root | null = null
let widgetContainer: HTMLDivElement | null = null
let currentActiveElement: TextInputElement | null = null

// Track pending timeouts for cleanup
const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>()

// MutationObserver for element removal detection
let elementRemovalObserver: MutationObserver | null = null

// =============================================================================
// Type Guards
// =============================================================================

function isTextInputElement(element: EventTarget | Node | null): element is TextInputElement {
  if (!element || !(element instanceof HTMLElement)) return false

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly
  }

  if (element instanceof HTMLDivElement && element.contentEditable === "true") {
    return true
  }

  return false
}

function isElementInDOM(element: HTMLElement | null): boolean {
  return element !== null && document.body.contains(element)
}

// =============================================================================
// Timeout Management
// =============================================================================

function createTrackedTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
  const timeoutId = setTimeout(() => {
    pendingTimeouts.delete(timeoutId)
    callback()
  }, ms)
  pendingTimeouts.add(timeoutId)
  return timeoutId
}

function cancelAllTimeouts(): void {
  pendingTimeouts.forEach(timeoutId => {
    clearTimeout(timeoutId)
  })
  pendingTimeouts.clear()
}

// =============================================================================
// MutationObserver for Element Removal
// =============================================================================

function observeElementRemoval(element: HTMLElement): void {
  elementRemovalObserver?.disconnect()

  elementRemovalObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const removedNode of mutation.removedNodes) {
        if (
          removedNode === element ||
          (removedNode instanceof HTMLElement && removedNode.contains(element))
        ) {
          hideWidget()
          return
        }
      }
    }
  })

  elementRemovalObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

function stopObservingElementRemoval(): void {
  elementRemovalObserver?.disconnect()
  elementRemovalObserver = null
}

// =============================================================================
// Widget Management
// =============================================================================

function createWidgetContainer(): HTMLDivElement {
  const container = document.createElement("div")
  container.id = "prompt-tuner-widget-root"
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 2147483647;
  `
  return container
}

function showWidget(element: TextInputElement): void {
  // Don't show if it's the same element
  if (element === currentActiveElement && widgetRoot) return

  currentActiveElement = element

  // Create container if needed
  if (!widgetContainer) {
    widgetContainer = createWidgetContainer()
    document.body.appendChild(widgetContainer)
  }

  // Create React root if needed
  widgetRoot ??= createRoot(widgetContainer)

  // Start observing for element removal
  observeElementRemoval(element)

  // Render widget
  widgetRoot.render(<SparkleWidget activeElement={element} />)
}

function hideWidget(): void {
  stopObservingElementRemoval()

  if (widgetRoot) {
    widgetRoot.unmount()
    widgetRoot = null
  }

  if (widgetContainer) {
    widgetContainer.remove()
    widgetContainer = null
  }

  currentActiveElement = null
}

// =============================================================================
// Event Handlers
// =============================================================================

function handleFocusIn(event: FocusEvent): void {
  const target = event.target
  if (isTextInputElement(target)) {
    showWidget(target)
  }
}

function handleClick(event: MouseEvent): void {
  const target = event.target

  if (isTextInputElement(target)) {
    showWidget(target)
    return
  }

  // Check if clicking inside widget container
  if (target instanceof Node) {
    if (
      widgetContainer?.contains(target) ||
      (target instanceof Element && target.closest("#prompt-tuner-widget-root"))
    ) {
      return
    }
  }

  // Hide widget when clicking outside
  const activeElement = getActiveTextInput()
  if (!activeElement || !isTextInputElement(activeElement)) {
    hideWidget()
  }
}

const handleInput = throttle((event: Event): void => {
  const target = event.target
  if (isTextInputElement(target) && document.activeElement === target) {
    showWidget(target)
  }
}, 100)

function handleBlur(event: FocusEvent): void {
  const target = event.target
  if (!isTextInputElement(target)) return

  // Use timeout to allow widget button clicks
  createTrackedTimeout(() => {
    const activeElement = document.activeElement

    if (
      !isTextInputElement(activeElement) &&
      activeElement !== widgetContainer &&
      !widgetContainer?.contains(activeElement as Node)
    ) {
      hideWidget()
    }
  }, 150)
}

// =============================================================================
// SPA Navigation Handling
// =============================================================================

function handleNavigation(): void {
  if (currentActiveElement && !isElementInDOM(currentActiveElement)) {
    hideWidget()
  }
}

function setupNavigationListeners(): void {
  window.addEventListener("popstate", handleNavigation)
  window.addEventListener("hashchange", handleNavigation)
}

function removeNavigationListeners(): void {
  window.removeEventListener("popstate", handleNavigation)
  window.removeEventListener("hashchange", handleNavigation)
}

// =============================================================================
// Lifecycle Management
// =============================================================================

function setupListeners(): void {
  // Only run on supported platforms
  if (!isSupportedPlatform()) return

  document.addEventListener("focusin", handleFocusIn, true)
  document.addEventListener("click", handleClick, true)
  document.addEventListener("input", handleInput, true)
  document.addEventListener("focusout", handleBlur, true)

  setupNavigationListeners()

  // Check for already active input
  const activeElement = getActiveTextInput()
  if (activeElement && document.activeElement === activeElement) {
    showWidget(activeElement)
  }
}

function cleanup(): void {
  document.removeEventListener("focusin", handleFocusIn, true)
  document.removeEventListener("click", handleClick, true)
  document.removeEventListener("input", handleInput, true)
  document.removeEventListener("focusout", handleBlur, true)

  removeNavigationListeners()
  cancelAllTimeouts()
  stopObservingElementRemoval()
  hideWidget()
}

// =============================================================================
// Initialization
// =============================================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setupListeners()
  }, { once: true })
} else {
  setupListeners()
}

window.addEventListener("beforeunload", cleanup, { once: true })

// HMR cleanup
if (import.meta.hot) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  import.meta.hot.dispose(() => {
    cleanup()
  })
}

export {}
